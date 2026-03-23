-- Remove apenas o lote de 50 questoes autorais do seed_50_questoes_concursos.sql.
-- Passos:
-- 1. remove as questoes pelo enunciado exato
-- 2. remove os exames do lote apenas se ficarem sem questoes vinculadas

with question_bank as (
  select *
  from (
    values
      ('Nos termos da norma-padrao da lingua portuguesa, assinale a alternativa em que o emprego da crase esta correto.'),
      ('Assinale a alternativa em que a concordancia verbal esta de acordo com a norma-padrao.'),
      ('Em uma reparticao, 35 processos foram arquivados pela manha e 21 a tarde. O total de processos arquivados no dia foi'),
      ('No Windows 11, o atalho de teclado usado para copiar um item selecionado e'),
      ('Conforme a Lei Geral de Protecao de Dados Pessoais, dado pessoal sensivel e aquele referente a'),
      ('No Regime Geral de Previdencia Social, a aposentadoria programada exige, para o homem, idade minima de'),
      ('Assinale a alternativa que apresenta um principio da seguridade social previsto na Constituicao Federal.'),
      ('Na frase "Os segurados mantiveram seus dados atualizados", o termo destacado classifica-se como'),
      ('Em uma fila com 120 requerimentos, 25% foram analisados. Quantos requerimentos restaram sem analise?'),
      ('No atendimento ao publico, constitui boa pratica de comunicacao'),
      ('Em produtos bancarios, a conta corrente destinada a movimentacao financeira do cliente permite, em regra,'),
      ('O PIX caracteriza-se por ser um arranjo de pagamento que permite transferencias'),
      ('Em vendas consultivas, a etapa em que o atendente identifica necessidades do cliente corresponde a'),
      ('Assinale a alternativa em que a regencia verbal esta correta.'),
      ('Uma aplicacao de R$ 2.000,00 rendeu 10% em determinado periodo. O valor do rendimento foi de'),
      ('De acordo com a Lei n. 8.112/1990, a investidura em cargo publico ocorre com'),
      ('O poder administrativo que permite a apuracao e sancao de infracoes funcionais e o poder'),
      ('Assinale a alternativa correta acerca do arquivamento de documentos.'),
      ('No pacote Microsoft Office, o aplicativo voltado predominantemente para planilhas eletronicas e o'),
      ('Se uma equipe conclui um protocolo em 12 minutos, quantos protocolos iguais concluira em 2 horas, mantendo o mesmo ritmo?'),
      ('Na perspectiva da avaliacao formativa, o professor deve'),
      ('A Base Nacional Comum Curricular orienta-se pelo desenvolvimento de'),
      ('Em educacao inclusiva, a garantia de acesso, participacao e aprendizagem de todos os estudantes pressupoe'),
      ('O Estatuto da Crianca e do Adolescente considera crianca a pessoa com ate'),
      ('Ao planejar uma sequencia didatica, a definicao clara de objetivos de aprendizagem favorece'),
      ('Nos termos da Constituicao Federal, a administracao publica obedecera, entre outros, ao principio da'),
      ('O remedio constitucional destinado a proteger direito liquido e certo nao amparado por habeas corpus nem habeas data e o'),
      ('Na Justica do Trabalho, a conciliacao e valorizada porque'),
      ('Assinale a alternativa em que a pontuacao esta correta.'),
      ('Um servidor trabalhou 6 horas por dia durante 5 dias, totalizando'),
      ('No atendimento presencial, a postura profissional adequada inclui'),
      ('A administracao de materiais busca, entre outros objetivos,'),
      ('Em redacao oficial, o atributo da clareza exige'),
      ('Assinale a alternativa em que todas as palavras estao corretamente grafadas.'),
      ('Se um setor possui 48 pastas e deseja distribui-las igualmente entre 6 gavetas, cada gaveta recebera'),
      ('Entre as funcoes sociais tradicionalmente associadas a Caixa Economica Federal, destaca-se a operacionalizacao de'),
      ('No credito bancario, a analise de risco busca avaliar a'),
      ('Em seguranca da informacao, o cuidado de nao compartilhar senhas relaciona-se diretamente ao principio da'),
      ('Uma compra parcelada em 4 vezes iguais de R$ 125,00 totaliza'),
      ('No atendimento a clientes, a oferta de produtos deve observar, eticamente, a'),
      ('O voto, no Brasil, e caracterizado constitucionalmente como'),
      ('Constitui competencia da Justica Eleitoral'),
      ('Na frase "Os eleitores se informaram antes da votacao", o sujeito da oracao e'),
      ('Se uma urna foi testada em 9 secoes e cada secao realizou 3 simulacoes, o total de simulacoes foi'),
      ('A conduta do servidor que trata todos os usuarios com respeito e imparcialidade esta alinhada ao principio da'),
      ('No inquerito policial, o escrivao desempenha papel importante porque'),
      ('A cadeia de custodia da prova visa assegurar'),
      ('Em seguranca da informacao, phishing e uma tecnica usada para'),
      ('Assinale a alternativa em que o uso do porque esta correto.'),
      ('Uma equipe registrou 18 boletins pela manha e 27 a tarde. O total registrado foi de'),
      ('No contexto da redacao oficial, a impessoalidade significa que o texto deve'),
      ('O beneficio devido ao segurado incapacitado temporariamente para o trabalho e o'),
      ('No atendimento digital, a autenticacao em dois fatores aumenta a seguranca porque'),
      ('A gestao democratica da escola pressupoe'),
      ('No processo administrativo, o protocolo adequado de documentos favorece'),
      ('No contexto de educacao financeira, o habito de reservar parte da renda antes do consumo contribui para'),
      ('A linguagem simples na comunicacao institucional favorece'),
      ('O direito ao contraditorio e a ampla defesa aplica-se, em regra, aos processos'),
      ('No Excel, a formula usada para somar os valores do intervalo A1 ate A5, na versao em portugues, e'),
      ('No atendimento ao cidadao em unidade policial, o registro fiel das informacoes e importante porque')
  ) as q(enunciado)
),
seed_exams as (
  select *
  from (
    values
      ('TJ-SP - Escrevente Tecnico Judiciario', 'VUNESP', 2023),
      ('INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022),
      ('Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023),
      ('Policia Federal - Agente Administrativo', 'CEBRASPE', 2021),
      ('SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024),
      ('TRT-2 - Tecnico Judiciario', 'FCC', 2022),
      ('Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023),
      ('Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024),
      ('TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024),
      ('Policia Civil SP - Escrivao', 'VUNESP', 2023)
  ) as exams(concurso, banca, ano)
),
deleted_questions as (
  delete from public.questions
  where enunciado in (select enunciado from question_bank)
  returning exam_id
)
delete from public.exams e
using seed_exams se
where e.concurso = se.concurso
  and e.banca = se.banca
  and e.ano = se.ano
  and not exists (
    select 1
    from public.questions q
    where q.exam_id = e.id
  );
