"""Treinamento reproduzível e análise local do piloto TOTVS Insight."""
from pathlib import Path
from collections import Counter
import json, re, hashlib
import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import precision_score, recall_score, f1_score, fbeta_score, accuracy_score, confusion_matrix

SEED=2026
LIMIARES=[.20,.35,.50,.65]

def limpar(texto):
    texto=re.sub(r'\[LOCUTOR\s+\d+\]:',' ',texto,flags=re.I)
    texto=re.sub(r'\[(PESSOA|LOCAL|EMPRESA)\]',' ',texto,flags=re.I)
    return re.sub(r'\s+',' ',texto).strip().lower()

def metricas(y,p):
    return {'precision':precision_score(y,p,zero_division=0),'recall':recall_score(y,p,zero_division=0),
            'f1':f1_score(y,p,zero_division=0),'f2':fbeta_score(y,p,beta=2,zero_division=0),
            'accuracy':accuracy_score(y,p)}

def configuracoes():
    configs=[]
    for algoritmo in ['Logistica','NaiveBayes']:
        for balanceado in [False,True]:
            for valor in ([1.,10.] if algoritmo=='Logistica' else [.1,1.]):
                # Caracteres só na logística; NB mantém representação de palavras.
                for representacao in (['palavras','mista'] if algoritmo=='Logistica' else ['palavras']):
                    configs.append(dict(algoritmo=algoritmo,balanceado=balanceado,valor=valor,representacao=representacao))
    return configs

def criar(config):
    words=TfidfVectorizer(ngram_range=(1,2),strip_accents='unicode',sublinear_tf=True,min_df=1,max_features=20000)
    features=words
    if config['representacao']=='mista':
        chars=TfidfVectorizer(analyzer='char_wb',ngram_range=(3,5),strip_accents='unicode',sublinear_tf=True,min_df=2,max_features=20000)
        features=FeatureUnion([('palavra',words),('caractere',chars)],transformer_weights={'palavra':1.,'caractere':.5})
    clf=(LogisticRegression(C=config['valor'],max_iter=2000,random_state=SEED)
         if config['algoritmo']=='Logistica' else MultinomialNB(alpha=config['valor']))
    return Pipeline([('texto',features),('clf',clf)])

def ajustar(config,data):
    model=criar(config)
    kwargs={'clf__sample_weight':compute_sample_weight('balanced',data['y'])} if config['balanceado'] else {}
    return model.fit(data['texto_modelo'],data['y'],**kwargs)

def escolher(data,seed=SEED+1):
    configs=configuracoes()
    cv=StratifiedGroupKFold(n_splits=3,shuffle=True,random_state=seed)
    folds=list(cv.split(data['texto_modelo'],data['y'],data['codigo_cliente']))
    rows=[]; scores={}
    for idx,config in enumerate(configs):
        oof=np.zeros(len(data))
        for tr,va in folds:
            train,valid=data.iloc[tr],data.iloc[va]
            if train['y'].nunique()<2 or valid['y'].nunique()<2:
                raise ValueError('Há poucos exemplos por classe/grupo para validar. Amplie a base antes de treinar.')
            assert set(train['codigo_cliente']).isdisjoint(valid['codigo_cliente'])
            oof[va]=ajustar(config,train).predict_proba(valid['texto_modelo'])[:,1]
        scores[idx]=oof
        for threshold in LIMIARES:
            m=metricas(data['y'],oof>=threshold)
            rows.append({'config_id':idx,**config,'limiar':threshold,**m,'piso_precision':m['precision']>=.5})
    grid=pd.DataFrame(rows).sort_values(['piso_precision','f2','recall','f1','precision'],ascending=False,kind='stable')
    return grid,configs,scores

def carregar(base):
    raw=pd.read_csv(base/'dados'/'trechos_rotulados.csv',dtype=str,keep_default_na=False)
    human=raw['rotulo_humano'].str.strip().str.lower()
    if not human.isin(['','risco','neutro','inconclusivo']).all():
        raise ValueError('Use risco, neutro ou inconclusivo em rotulo_humano.')
    if raw.loc[human.ne(''),'revisor'].str.strip().eq('').any():
        raise ValueError('Identifique o revisor de cada rótulo humano preenchido.')
    raw['rotulo']=human.where(human.ne(''),raw['rotulo_inicial'])
    raw['revisado']=human.ne('')
    partition=pd.read_csv(base/'referencia_v1'/'particoes.csv',dtype=str)
    if not raw['trecho_id'].is_unique or not partition['trecho_id'].is_unique:
        raise ValueError('IDs de trechos duplicados.')
    raw=raw.merge(partition[['trecho_id','particao']],on='trecho_id',how='left',validate='one_to_one')
    # Novos rótulos de antigos inconclusivos não entram silenciosamente no teste nem no treino.
    raw['particao']=raw['particao'].fillna('fora_particao_original')
    df=raw.loc[raw['rotulo'].isin(['neutro','risco']) & raw['particao'].isin(['desenvolvimento','teste'])].copy()
    df['y']=df['rotulo'].eq('risco').astype(int)
    df['texto_modelo']=df['texto'].map(limpar)
    if df['texto_modelo'].duplicated().any():
        raise ValueError('Resolva duplicatas textuais antes de treinar.')
    dev=df.loc[df['particao'].eq('desenvolvimento')].reset_index(drop=True)
    test=df.loc[df['particao'].eq('teste')].reset_index(drop=True)
    assert set(dev['id_reuniao']).isdisjoint(test['id_reuniao'])
    assert set(dev['codigo_cliente']).isdisjoint(test['codigo_cliente'])
    return raw,dev,test

def treinar(base):
    base=Path(base); out=base/'resultados'; out.mkdir(exist_ok=True)
    raw,dev,test=carregar(base)
    # Avaliação do procedimento de seleção sem usar o conjunto histórico de teste.
    nested=[]; nested_pred=[]
    cv=StratifiedGroupKFold(n_splits=3,shuffle=True,random_state=SEED+30)
    for fold,(tr,va) in enumerate(cv.split(dev['texto_modelo'],dev['y'],dev['codigo_cliente']),1):
        inner_data=dev.iloc[tr].reset_index(drop=True); val=dev.iloc[va]
        grid,configs,_=escolher(inner_data,SEED+fold+50)
        chosen=grid.iloc[0]; model=ajustar(configs[int(chosen['config_id'])],inner_data)
        pred=model.predict_proba(val['texto_modelo'])[:,1]>=chosen['limiar']
        nested.append({'fold':fold,'n':len(val),'config_id':int(chosen['config_id']),
                       'algoritmo':chosen['algoritmo'],'limiar':float(chosen['limiar']),**metricas(val['y'],pred)})
        nested_pred.extend({'trecho_id':r['trecho_id'],'referencia':int(r['y']),'predicao':int(p)}
                           for (_,r),p in zip(val.iterrows(),pred))
    pd.DataFrame(nested).to_csv(out/'validacao_aninhada.csv',index=False)
    pd.DataFrame(nested_pred).to_csv(out/'predicoes_aninhadas.csv',index=False)
    grid,configs,oof=escolher(dev)
    grid.to_csv(out/'busca_configuracoes.csv',index=False)
    chosen=grid.iloc[0]; config=configs[int(chosen['config_id'])]
    # Configuração e limiar ficam definidos e registrados ANTES da avaliação histórica.
    selected={**config,'config_id':int(chosen['config_id']),'limiar':float(chosen['limiar']),
              'piso_precision_validacao':bool(chosen['piso_precision'])}
    (out/'escolha_desenvolvimento.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2),encoding='utf-8')
    rows=[]; preds=[]; models={}
    for algorithm in ['Logistica','NaiveBayes']:
        best=grid.loc[grid['algoritmo'].eq(algorithm)].iloc[0]
        best_config=configs[int(best['config_id'])]
        model=ajustar(best_config,dev)
        probs=model.predict_proba(test['texto_modelo'])[:,1]
        pred=probs>=best['limiar']
        rows.append({'modelo':algorithm,'limiar':float(best['limiar']),**metricas(test['y'],pred)})
        models[algorithm]=(model,float(best['limiar']))
        for (_,r),score,p in zip(test.iterrows(),probs,pred):
            preds.append({'modelo':algorithm,'trecho_id':r['trecho_id'],'referencia':int(r['y']),
                          'predicao':int(p),'score':float(score),'texto':r['texto'],
                          'justificativa_rotulo':r['justificativa'],
                          'tipo_erro':'FN' if r['y']==1 and not p else ('FP' if r['y']==0 and p else 'acerto')})
    majority=int(dev['y'].mode().iloc[0])
    rows.append({'modelo':'Majoritaria','limiar':None,**metricas(test['y'],np.full(len(test),majority))})
    pd.DataFrame(rows).to_csv(out/'metricas_historicas.csv',index=False)
    pd.DataFrame(preds).to_csv(out/'predicoes_historicas.csv',index=False,encoding='utf-8-sig')
    pd.DataFrame(preds).query("tipo_erro != 'acerto'").to_csv(out/'erros_historicos.csv',index=False,encoding='utf-8-sig')
    # Fila de revisão: só predições fora do fold nos dados de desenvolvimento.
    review=raw.copy(); review['motivo_prioridade']='Revisão de referência pendente'
    review['prioridade']=3
    review.loc[review['rotulo'].eq('inconclusivo'),['prioridade','motivo_prioridade']]=[1,'Contexto insuficiente ou ruído: conferir reunião de origem']
    predicted=oof[int(chosen['config_id'])]>=chosen['limiar']
    for i,r in dev.iterrows():
        if predicted[i]!=r['y']:
            review.loc[review['trecho_id'].eq(r['trecho_id']),['prioridade','motivo_prioridade']]=[2,'Desacordo na validação de desenvolvimento; revisar sem assumir que o modelo está certo']
    review.loc[review['particao'].eq('teste'),'motivo_prioridade']='Teste histórico: revisão independente, sem consultar predições'
    review.loc[review['revisado'],'prioridade']=4
    review.sort_values(['prioridade','trecho_id']).to_csv(out/'fila_revisao.csv',index=False,encoding='utf-8-sig')
    winner_model=models[config['algoritmo']][0]
    known_hashes={hashlib.sha256(limpar(t).encode()).hexdigest() for t in raw['texto']}
    bundle={'modelo':winner_model,'limiar':selected['limiar'],'config':config,
            'conhecidos':known_hashes,'status':('exploratorio_com_rotulos_revisados' if bool(raw['revisado'].all()) else 'exploratorio_com_rotulos_provisorios')}
    joblib.dump(bundle,out/'modelo_piloto.joblib')
    summary={'selecao':selected,'validacao_aninhada':metricas([r['referencia'] for r in nested_pred],[r['predicao'] for r in nested_pred]),
             'n_desenvolvimento':len(dev),'n_teste_historico':len(test),'n_revisados_humano':int(raw['revisado'].sum()),
             'metricas_historicas':rows,
             'aviso':'Teste histórico já inspecionado na versão anterior. Não é nova validação independente. ' + ('Todos os rótulos possuem revisão humana registrada.' if bool(raw['revisado'].all()) else 'Há rótulos sem revisão humana.')}
    (out/'resumo_v2.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    return summary

def segmentar(texto,max_chars=1300):
    if not isinstance(texto,str):raise ValueError('A transcrição deve ser texto.')
    if max_chars<100:raise ValueError('O tamanho de janela deve ser pelo menos 100 caracteres.')
    if len(texto)>2_000_000:raise ValueError('Transcrição muito grande. Separe por reunião (limite: 2 milhões de caracteres).')
    start=0; windows=[]
    while start<len(texto):
        end=min(start+max_chars,len(texto))
        if end<len(texto):
            candidates=[m.end() for m in re.finditer(r'[.!?](?:\s+)|\n',texto[start:end]) if m.end()>max_chars*.6]
            if candidates:end=start+candidates[-1]
            else:
                space=texto.rfind(' ',start+int(max_chars*.6),end)
                if space>start:end=space
        windows.append((start,end,texto[start:end])); start=end
    return windows

def qualidade(texto):
    words=re.findall(r'\b[^\W\d_]+\b',limpar(texto),flags=re.U)
    if len(words)<20:return 'Trecho curto: menos de 20 palavras úteis'
    grams=list(zip(words,words[1:],words[2:]))
    if grams and max(Counter(grams).values())/len(grams)>.12:
        return 'Repetição excessiva: conferir qualidade da transcrição'
    return None

def importar_json(path):
    source=Path(path).read_text(encoding='utf-8-sig'); decoder=json.JSONDecoder(); pos=0; records=[]
    while pos<len(source):
        while pos<len(source) and source[pos].isspace():pos+=1
        if pos>=len(source):break
        try:obj,pos=decoder.raw_decode(source,pos)
        except json.JSONDecodeError as error:raise ValueError(f'JSON inválido na posição {error.pos}.') from error
        records.extend(obj if isinstance(obj,list) else [obj])
    result=[]
    for i,r in enumerate(records,1):
        if not isinstance(r,dict) or not isinstance(r.get('ANON_TRANSCRICAO'),str):
            raise ValueError(f'Registro {i} sem campo textual ANON_TRANSCRICAO.')
        result.append({'id_reuniao':str(r.get('ID_MEETING',i)),'texto':r['ANON_TRANSCRICAO']})
    return result

def analisar_transcricao(texto,bundle,id_reuniao='nova'):
    rows=[]
    for index,(start,end,excerpt) in enumerate(segmentar(texto),1):
        reason=qualidade(excerpt)
        record={'id_reuniao':id_reuniao,'trecho':index,'inicio':start,'fim':end,'texto':excerpt,
                'score_modelo':None,'rotulo_modelo':None,'termos_presentes':[],
                'recomendacao':'Conferir o texto original antes de interpretar.','status':'contexto_insuficiente'}
        if reason:
            record['motivo']=reason
        else:
            clean=limpar(excerpt); model=bundle['modelo']
            vector=model.named_steps['texto'].transform([clean])
            if vector.nnz==0:
                record['motivo']='Vocabulário não reconhecido pelo modelo'
            else:
                score=float(model.predict_proba([clean])[0,1]); risk=score>=bundle['limiar']
                record.update(score_modelo=score,rotulo_modelo='risco' if risk else 'neutro',
                              status='revisao_recomendada' if risk else 'sem_alerta_automatico',
                              motivo='Classificação exploratória; score não é probabilidade de churn',
                              recomendacao=('Revisar contexto, identificar fornecedor e responsável pela fala e avaliar contato de Customer Success.' if risk else
                                            'Manter acompanhamento habitual; ausência de alerta não garante ausência de risco.'))
                # Termos observados com maior peso TF-IDF, sem atribuir causalidade ou afirmar explicação do classificador.
                names=model.named_steps['texto'].get_feature_names_out()
                present=sorted(zip(vector.indices,vector.data),key=lambda pair:pair[1],reverse=True)
                record['termos_presentes']=[str(names[j]).replace('palavra__','') for j,_ in present if not str(names[j]).startswith('caractere__')][:8]
                record['trecho_ja_anotado']=hashlib.sha256(clean.encode()).hexdigest() in bundle['conhecidos']
        rows.append(record)
    counts=Counter(r['status'] for r in rows)
    return {'id_reuniao':id_reuniao,'status_modelo':bundle['status'],
            'total_trechos':len(rows),'trechos_com_alerta':counts['revisao_recomendada'],
            'trechos_sem_contexto':counts['contexto_insuficiente'],
            'aviso':'Contagens de trechos. Não são número de clientes em risco nem probabilidade de cancelamento.',
            'trechos':rows}
