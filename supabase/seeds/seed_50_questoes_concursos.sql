-- Seed com 50 questoes autorais inspiradas no estilo de concursos publicos reais.
-- Este arquivo padroniza a relacao disciplina -> assunto (topic).
--
-- Catalogo adotado neste lote:
-- Lingua Portuguesa -> Crase, Concordancia verbal, Classes gramaticais, Regencia verbal,
--   Pontuacao, Ortografia, Sujeito, Uso dos porques
-- Raciocinio Logico -> Operacoes basicas, Proporcionalidade, Multiplicacao
-- Matematica -> Porcentagem, Multiplicacao, Divisao, Adicao
-- Matematica Financeira -> Porcentagem, Operacoes basicas
-- Informatica -> Windows, Microsoft Office, Seguranca da informacao, Planilhas eletronicas
-- Legislacao -> LGPD
-- Direito Previdenciario -> Beneficios, Seguridade social
-- Atendimento -> Relacao com o usuario, Postura profissional, Atendimento ao publico
-- Conhecimentos Bancarios -> Conta corrente, Meios de pagamento, Sistema financeiro,
--   Credito, Educacao financeira
-- Vendas e Negociacao -> Atendimento comercial
-- Direito Administrativo -> Lei 8.112/1990, Poderes administrativos
-- Arquivologia -> Classificacao de documentos
-- Pedagogia -> Avaliacao da aprendizagem, Educacao inclusiva, Planejamento
-- Legislacao Educacional -> BNCC, ECA, Gestao democratica
-- Direito Constitucional -> Principios da administracao publica, Remedios constitucionais,
--   Garantias fundamentais
-- Direito do Trabalho -> Processo do trabalho
-- Administracao -> Gestao de materiais, Protocolo
-- Redacao Oficial -> Clareza, Impessoalidade, Linguagem simples
-- Etica -> Conduta profissional, Servico publico
-- Direito Eleitoral -> Direitos politicos, Justica Eleitoral
-- Direito Processual Penal -> Inquerito policial
-- Criminologia -> Cadeia de custodia

with seed_exams as (
  select *
  from (
    values
      ('TJ-SP - Escrevente Tecnico Judiciario', 'VUNESP', 2023, 70),
      ('INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022, 72),
      ('Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023, 68),
      ('Policia Federal - Agente Administrativo', 'CEBRASPE', 2021, 75),
      ('SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024, 60),
      ('TRT-2 - Tecnico Judiciario', 'FCC', 2022, 73),
      ('Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023, 58),
      ('Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024, 70),
      ('TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024, 74),
      ('Policia Civil SP - Escrivao', 'VUNESP', 2023, 69)
  ) as exams(concurso, banca, ano, nota_corte)
),
inserted_exams as (
  insert into public.exams (concurso, banca, ano, nota_corte)
  select se.concurso, se.banca, se.ano, se.nota_corte
  from seed_exams se
  where not exists (
    select 1
    from public.exams e
    where e.concurso = se.concurso
      and e.banca = se.banca
      and e.ano = se.ano
  )
  returning id, concurso, banca, ano
),
target_exams as (
  select e.id, e.concurso, e.banca, e.ano
  from public.exams e
  join seed_exams se
    on se.concurso = e.concurso
   and se.banca = e.banca
   and se.ano = e.ano
),
question_bank as (
  select *
  from (
    values
      (
        'TJ-SP - Escrevente Tecnico Judiciario', 'VUNESP', 2023,
        'Nos termos da norma-padrao da lingua portuguesa, assinale a alternativa em que o emprego da crase esta correto.',
        'O servidor compareceu a audiencia sem atraso.',
        'A candidata dirigiu-se a reparticao para entregar os documentos.',
        'O processo foi encaminhado a juiza responsavel.',
        'Os autos retornaram a uma das varas civeis.',
        'A sessao ocorreu a portas fechadas.',
        'B', 'Lingua Portuguesa', 'Crase'
      ),
      (
        'TJ-SP - Escrevente Tecnico Judiciario', 'VUNESP', 2023,
        'Assinale a alternativa em que a concordancia verbal esta de acordo com a norma-padrao.',
        'Houveram diversas reclamacoes sobre o atendimento.',
        'Existe documentos pendentes de assinatura.',
        'Fazem dois anos que o contrato foi encerrado.',
        'Devem haver medidas mais eficazes de controle.',
        'Pode haver questionamentos sobre o edital.',
        'E', 'Lingua Portuguesa', 'Concordancia verbal'
      ),
      (
        'TJ-SP - Escrevente Tecnico Judiciario', 'VUNESP', 2023,
        'Em uma reparticao, 35 processos foram arquivados pela manha e 21 a tarde. O total de processos arquivados no dia foi',
        '54',
        '55',
        '56',
        '57',
        '58',
        'C', 'Raciocinio Logico', 'Operacoes basicas'
      ),
      (
        'TJ-SP - Escrevente Tecnico Judiciario', 'VUNESP', 2023,
        'No Windows 11, o atalho de teclado usado para copiar um item selecionado e',
        'Ctrl + X',
        'Ctrl + C',
        'Ctrl + V',
        'Ctrl + Z',
        'Alt + Tab',
        'B', 'Informatica', 'Windows'
      ),
      (
        'TJ-SP - Escrevente Tecnico Judiciario', 'VUNESP', 2023,
        'Conforme a Lei Geral de Protecao de Dados Pessoais, dado pessoal sensivel e aquele referente a',
        'endereco residencial',
        'numero de matricula funcional',
        'opiniao politica',
        'idade do titular',
        'cidade natal',
        'C', 'Legislacao', 'LGPD'
      ),

      (
        'INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022,
        'No Regime Geral de Previdencia Social, a aposentadoria programada exige, para o homem, idade minima de',
        '60 anos',
        '62 anos',
        '63 anos',
        '65 anos',
        '67 anos',
        'D', 'Direito Previdenciario', 'Beneficios'
      ),
      (
        'INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022,
        'Assinale a alternativa que apresenta um principio da seguridade social previsto na Constituicao Federal.',
        'Sigilo absoluto das contribuicoes',
        'Universalidade da cobertura e do atendimento',
        'Privatizacao da previdencia obrigatoria',
        'Filiacao facultativa para empregado urbano',
        'Contribuicao exclusiva da Uniao',
        'B', 'Direito Previdenciario', 'Seguridade social'
      ),
      (
        'INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022,
        'Na frase "Os segurados mantiveram seus dados atualizados", o termo destacado classifica-se como',
        'adjetivo',
        'adverbio',
        'substantivo',
        'pronome',
        'verbo',
        'A', 'Lingua Portuguesa', 'Classes gramaticais'
      ),
      (
        'INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022,
        'Em uma fila com 120 requerimentos, 25% foram analisados. Quantos requerimentos restaram sem analise?',
        '30',
        '60',
        '75',
        '90',
        '95',
        'D', 'Matematica', 'Porcentagem'
      ),
      (
        'INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022,
        'No atendimento ao publico, constitui boa pratica de comunicacao',
        'interromper o usuario para ganhar tempo',
        'usar linguagem tecnica sem adaptacao',
        'confirmar se a duvida foi compreendida',
        'evitar registro de demandas simples',
        'responder apenas por memorando interno',
        'C', 'Atendimento', 'Relacao com o usuario'
      ),

      (
        'Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023,
        'Em produtos bancarios, a conta corrente destinada a movimentacao financeira do cliente permite, em regra,',
        'somente aplicacao em renda fixa',
        'recebimentos, pagamentos e transferencias',
        'uso exclusivo para pessoa juridica',
        'movimentacao apenas em horario bancario presencial',
        'saques apenas com autorizacao judicial',
        'B', 'Conhecimentos Bancarios', 'Conta corrente'
      ),
      (
        'Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023,
        'O PIX caracteriza-se por ser um arranjo de pagamento que permite transferencias',
        'apenas entre contas do mesmo banco',
        'somente em dias uteis',
        'instantaneas, inclusive fora do horario comercial',
        'exclusivas para pessoas fisicas',
        'limitadas a boletos bancarios',
        'C', 'Conhecimentos Bancarios', 'Meios de pagamento'
      ),
      (
        'Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023,
        'Em vendas consultivas, a etapa em que o atendente identifica necessidades do cliente corresponde a',
        'pos-venda',
        'prospeccao',
        'qualificacao',
        'levantamento de necessidades',
        'fechamento',
        'D', 'Vendas e Negociacao', 'Atendimento comercial'
      ),
      (
        'Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023,
        'Assinale a alternativa em que a regencia verbal esta correta.',
        'O cliente preferiu mais o cartao digital.',
        'O gerente informou o correntista sobre a mudanca.',
        'Os investidores assistiram o relatorio do banco.',
        'A equipe visou ao os melhores resultados.',
        'O funcionario obedeceu o regulamento interno.',
        'B', 'Lingua Portuguesa', 'Regencia verbal'
      ),
      (
        'Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023,
        'Uma aplicacao de R$ 2.000,00 rendeu 10% em determinado periodo. O valor do rendimento foi de',
        'R$ 100,00',
        'R$ 150,00',
        'R$ 180,00',
        'R$ 200,00',
        'R$ 220,00',
        'D', 'Matematica Financeira', 'Porcentagem'
      ),

      (
        'Policia Federal - Agente Administrativo', 'CEBRASPE', 2021,
        'De acordo com a Lei n. 8.112/1990, a investidura em cargo publico ocorre com',
        'a aprovacao no concurso',
        'a nomeacao',
        'a posse',
        'o exercicio',
        'a homologacao do resultado',
        'C', 'Direito Administrativo', 'Lei 8.112/1990'
      ),
      (
        'Policia Federal - Agente Administrativo', 'CEBRASPE', 2021,
        'O poder administrativo que permite a apuracao e sancao de infracoes funcionais e o poder',
        'hierarquico',
        'disciplinar',
        'regulamentar',
        'de policia',
        'vinculado',
        'B', 'Direito Administrativo', 'Poderes administrativos'
      ),
      (
        'Policia Federal - Agente Administrativo', 'CEBRASPE', 2021,
        'Assinale a alternativa correta acerca do arquivamento de documentos.',
        'Todo documento deve ser descartado apos digitalizacao.',
        'A classificacao documental auxilia na recuperacao da informacao.',
        'Arquivos correntes nao sao consultados com frequencia.',
        'Documentos sigilosos independem de controle de acesso.',
        'A organizacao por assunto e vedada na administracao publica.',
        'B', 'Arquivologia', 'Classificacao de documentos'
      ),
      (
        'Policia Federal - Agente Administrativo', 'CEBRASPE', 2021,
        'No pacote Microsoft Office, o aplicativo voltado predominantemente para planilhas eletronicas e o',
        'Word',
        'PowerPoint',
        'Outlook',
        'Excel',
        'Access',
        'D', 'Informatica', 'Microsoft Office'
      ),
      (
        'Policia Federal - Agente Administrativo', 'CEBRASPE', 2021,
        'Se uma equipe conclui um protocolo em 12 minutos, quantos protocolos iguais concluira em 2 horas, mantendo o mesmo ritmo?',
        '8',
        '10',
        '12',
        '15',
        '20',
        'B', 'Raciocinio Logico', 'Proporcionalidade'
      ),

      (
        'SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024,
        'Na perspectiva da avaliacao formativa, o professor deve',
        'utilizar apenas provas finais padronizadas',
        'acompanhar continuamente o processo de aprendizagem',
        'atribuir nota sem devolutiva ao estudante',
        'privilegiar exclusivamente a memorizacao',
        'substituir planejamento por improvisacao',
        'B', 'Pedagogia', 'Avaliacao da aprendizagem'
      ),
      (
        'SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024,
        'A Base Nacional Comum Curricular orienta-se pelo desenvolvimento de',
        'sancoes disciplinares progressivas',
        'competencias e habilidades',
        'roteiros fixos de aula sem adaptacao',
        'curriculo unico municipal',
        'selecao de conteudos sem contexto',
        'B', 'Legislacao Educacional', 'BNCC'
      ),
      (
        'SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024,
        'Em educacao inclusiva, a garantia de acesso, participacao e aprendizagem de todos os estudantes pressupoe',
        'separacao permanente por desempenho',
        'padronizacao rigida de estrategias',
        'flexibilizacao pedagogica e acessibilidade',
        'reducao do curriculo para toda a turma',
        'dispensa da avaliacao escolar',
        'C', 'Pedagogia', 'Educacao inclusiva'
      ),
      (
        'SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024,
        'O Estatuto da Crianca e do Adolescente considera crianca a pessoa com ate',
        '10 anos incompletos',
        '11 anos completos',
        '12 anos incompletos',
        '12 anos completos',
        '13 anos incompletos',
        'C', 'Legislacao Educacional', 'ECA'
      ),
      (
        'SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024,
        'Ao planejar uma sequencia didatica, a definicao clara de objetivos de aprendizagem favorece',
        'a improvisacao integral do processo',
        'a avaliacao coerente com o ensino proposto',
        'a exclusao de estudantes com dificuldade',
        'a eliminacao de recursos diversos',
        'o foco exclusivo no livro didatico',
        'B', 'Pedagogia', 'Planejamento'
      ),

      (
        'TRT-2 - Tecnico Judiciario', 'FCC', 2022,
        'Nos termos da Constituicao Federal, a administracao publica obedecera, entre outros, ao principio da',
        'subjetividade',
        'oralidade',
        'publicidade',
        'informalidade',
        'facultatividade',
        'C', 'Direito Constitucional', 'Principios da administracao publica'
      ),
      (
        'TRT-2 - Tecnico Judiciario', 'FCC', 2022,
        'O remedio constitucional destinado a proteger direito liquido e certo nao amparado por habeas corpus nem habeas data e o',
        'mandado de injuncao',
        'mandado de seguranca',
        'habeas data',
        'habeas corpus',
        'acao popular',
        'B', 'Direito Constitucional', 'Remedios constitucionais'
      ),
      (
        'TRT-2 - Tecnico Judiciario', 'FCC', 2022,
        'Na Justica do Trabalho, a conciliacao e valorizada porque',
        'substitui sempre a sentenca judicial',
        'dispensa a presenca das partes',
        'constitui meio de solucao consensual do conflito',
        'elimina o contraditorio',
        'afasta a competencia do juiz',
        'C', 'Direito do Trabalho', 'Processo do trabalho'
      ),
      (
        'TRT-2 - Tecnico Judiciario', 'FCC', 2022,
        'Assinale a alternativa em que a pontuacao esta correta.',
        'Os servidores, protocolaram os pedidos no prazo.',
        'Quando o prazo termina, a parte deve ser intimada.',
        'A secretaria recebeu, ontem, os novos processos.',
        'O juiz analisou o caso e, decidiu de imediato.',
        'As testemunhas porem nao compareceram.',
        'C', 'Lingua Portuguesa', 'Pontuacao'
      ),
      (
        'TRT-2 - Tecnico Judiciario', 'FCC', 2022,
        'Um servidor trabalhou 6 horas por dia durante 5 dias, totalizando',
        '11 horas',
        '25 horas',
        '30 horas',
        '35 horas',
        '36 horas',
        'C', 'Matematica', 'Multiplicacao'
      ),

      (
        'Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023,
        'No atendimento presencial, a postura profissional adequada inclui',
        'tom de voz agressivo para impor autoridade',
        'escuta ativa e cordialidade',
        'respostas monossilabicas para agilizar a fila',
        'recusa em orientar o cidadao',
        'tratamento desigual conforme preferencia pessoal',
        'B', 'Atendimento', 'Postura profissional'
      ),
      (
        'Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023,
        'A administracao de materiais busca, entre outros objetivos,',
        'manter estoques sempre excessivos',
        'eliminar qualquer controle de entradas',
        'garantir disponibilidade com racionalidade de custos',
        'substituir planejamento por compras emergenciais',
        'dispensar inventarios periodicos',
        'C', 'Administracao', 'Gestao de materiais'
      ),
      (
        'Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023,
        'Em redacao oficial, o atributo da clareza exige',
        'frases prolixas e rebuscadas',
        'uso de ambiguidades elegantes',
        'informacoes objetivas e compreensiveis',
        'supressao de dados essenciais',
        'predominio de opinioes pessoais',
        'C', 'Redacao Oficial', 'Clareza'
      ),
      (
        'Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023,
        'Assinale a alternativa em que todas as palavras estao corretamente grafadas.',
        'excecao, analise, paralizacao',
        'excessao, analise, paralisacao',
        'excecao, analise, paralisacao',
        'excessao, analise, paralizacao',
        'exececao, analise, paralizacao',
        'C', 'Lingua Portuguesa', 'Ortografia'
      ),
      (
        'Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023,
        'Se um setor possui 48 pastas e deseja distribui-las igualmente entre 6 gavetas, cada gaveta recebera',
        '6',
        '7',
        '8',
        '9',
        '10',
        'C', 'Matematica', 'Divisao'
      ),

      (
        'Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024,
        'Entre as funcoes sociais tradicionalmente associadas a Caixa Economica Federal, destaca-se a operacionalizacao de',
        'politicas publicas e programas sociais',
        'fiscalizacao de tribunais',
        'registro civil de pessoas naturais',
        'controle externo do legislativo',
        'seguranca publica ostensiva',
        'A', 'Conhecimentos Bancarios', 'Sistema financeiro'
      ),
      (
        'Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024,
        'No credito bancario, a analise de risco busca avaliar a',
        'cor da marca institucional',
        'capacidade de pagamento do cliente',
        'localizacao geografica do caixa eletronico',
        'quantidade de agencias do municipio',
        'frequencia de reunioes da equipe',
        'B', 'Conhecimentos Bancarios', 'Credito'
      ),
      (
        'Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024,
        'Em seguranca da informacao, o cuidado de nao compartilhar senhas relaciona-se diretamente ao principio da',
        'economicidade',
        'tempestividade',
        'confidencialidade',
        'materialidade',
        'publicidade',
        'C', 'Informatica', 'Seguranca da informacao'
      ),
      (
        'Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024,
        'Uma compra parcelada em 4 vezes iguais de R$ 125,00 totaliza',
        'R$ 400,00',
        'R$ 450,00',
        'R$ 500,00',
        'R$ 550,00',
        'R$ 600,00',
        'C', 'Matematica Financeira', 'Operacoes basicas'
      ),
      (
        'Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024,
        'No atendimento a clientes, a oferta de produtos deve observar, eticamente, a',
        'omissao de informacoes relevantes',
        'adequacao ao perfil e a necessidade do cliente',
        'imposicao da opcao mais cara',
        'promessa de rendimento sem risco',
        'divulgacao de dados sigilosos',
        'B', 'Etica', 'Conduta profissional'
      ),

      (
        'TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024,
        'O voto, no Brasil, e caracterizado constitucionalmente como',
        'aberto e facultativo para todos',
        'secreto e direto',
        'indireto e censitario',
        'secreto e censitario',
        'aberto e obrigatorio para estrangeiros',
        'B', 'Direito Eleitoral', 'Direitos politicos'
      ),
      (
        'TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024,
        'Constitui competencia da Justica Eleitoral',
        'julgar exclusivamente causas trabalhistas',
        'administrar o processo eleitoral',
        'legislar sobre direito penal comum',
        'executar politicas de seguranca publica',
        'arrecadar tributos federais',
        'B', 'Direito Eleitoral', 'Justica Eleitoral'
      ),
      (
        'TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024,
        'Na frase "Os eleitores se informaram antes da votacao", o sujeito da oracao e',
        'oculto',
        'indeterminado',
        'os eleitores',
        'antes da votacao',
        'se',
        'C', 'Lingua Portuguesa', 'Sujeito'
      ),
      (
        'TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024,
        'Se uma urna foi testada em 9 secoes e cada secao realizou 3 simulacoes, o total de simulacoes foi',
        '12',
        '18',
        '24',
        '27',
        '36',
        'D', 'Raciocinio Logico', 'Multiplicacao'
      ),
      (
        'TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024,
        'A conduta do servidor que trata todos os usuarios com respeito e imparcialidade esta alinhada ao principio da',
        'pessoalidade',
        'impessoalidade',
        'informalidade',
        'subordinacao partidaria',
        'reserva de atendimento',
        'B', 'Etica', 'Servico publico'
      ),

      (
        'Policia Civil SP - Escrivao', 'VUNESP', 2023,
        'No inquerito policial, o escrivao desempenha papel importante porque',
        'substitui integralmente a autoridade policial',
        'realiza exclusivamente pericias criminais',
        'formaliza atos e registra termos do procedimento',
        'julga o investigado',
        'determina a pena aplicavel',
        'C', 'Direito Processual Penal', 'Inquerito policial'
      ),
      (
        'Policia Civil SP - Escrivao', 'VUNESP', 2023,
        'A cadeia de custodia da prova visa assegurar',
        'a eliminacao rapida de vestigios',
        'a rastreabilidade e preservacao dos vestigios',
        'a dispensa de documentacao formal',
        'o acesso irrestrito de qualquer pessoa ao material',
        'a substituicao da pericia oficial',
        'B', 'Criminologia', 'Cadeia de custodia'
      ),
      (
        'Policia Civil SP - Escrivao', 'VUNESP', 2023,
        'Em seguranca da informacao, phishing e uma tecnica usada para',
        'melhorar o desempenho do computador',
        'organizar arquivos em nuvem',
        'obter dados por meio de fraude ou engano',
        'criptografar backups automaticamente',
        'instalar drivers oficiais do sistema',
        'C', 'Informatica', 'Seguranca da informacao'
      ),
      (
        'Policia Civil SP - Escrivao', 'VUNESP', 2023,
        'Assinale a alternativa em que o uso do porque esta correto.',
        'Ninguem explicou por que o depoimento foi adiado.',
        'O servidor faltou por que estava doente?',
        'O motivo por que a diligencia atrasou nao foi informado.',
        'Encerraram a oitiva porque?',
        'Porque houve atraso no protocolo?',
        'A', 'Lingua Portuguesa', 'Uso dos porques'
      ),
      (
        'Policia Civil SP - Escrivao', 'VUNESP', 2023,
        'Uma equipe registrou 18 boletins pela manha e 27 a tarde. O total registrado foi de',
        '35',
        '40',
        '45',
        '50',
        '55',
        'C', 'Matematica', 'Adicao'
      ),

      (
        'TRT-2 - Tecnico Judiciario', 'FCC', 2022,
        'No contexto da redacao oficial, a impessoalidade significa que o texto deve',
        'expressar preferencias pessoais do redator',
        'focar na instituicao e no interesse publico',
        'adotar tom intimista',
        'usar girias para aproximacao',
        'dispensar formalidade administrativa',
        'B', 'Redacao Oficial', 'Impessoalidade'
      ),
      (
        'INSS - Tecnico do Seguro Social', 'CEBRASPE', 2022,
        'O beneficio devido ao segurado incapacitado temporariamente para o trabalho e o',
        'salario-familia',
        'auxilio por incapacidade temporaria',
        'auxilio-acidente',
        'salario-maternidade',
        'abono anual',
        'B', 'Direito Previdenciario', 'Beneficios'
      ),
      (
        'Banco do Brasil - Agente Comercial', 'CESGRANRIO', 2023,
        'No atendimento digital, a autenticacao em dois fatores aumenta a seguranca porque',
        'substitui a necessidade de senha',
        'dispensa cuidados do usuario',
        'adiciona uma camada extra de verificacao',
        'elimina qualquer risco de fraude',
        'permite acesso anonimo',
        'C', 'Informatica', 'Seguranca da informacao'
      ),
      (
        'SEDUC-SP - Professor de Educacao Basica', 'VUNESP', 2024,
        'A gestao democratica da escola pressupoe',
        'participacao da comunidade escolar nas decisoes',
        'centralizacao absoluta da direcao',
        'eliminacao do conselho escolar',
        'ausencia de planejamento coletivo',
        'restricao ao dialogo institucional',
        'A', 'Legislacao Educacional', 'Gestao democratica'
      ),
      (
        'Policia Federal - Agente Administrativo', 'CEBRASPE', 2021,
        'No processo administrativo, o protocolo adequado de documentos favorece',
        'a perda de rastreabilidade',
        'o controle e a localizacao dos expedientes',
        'a dispensa de numeracao',
        'a informalidade absoluta dos atos',
        'o descarte imediato de registros',
        'B', 'Administracao', 'Protocolo'
      ),
      (
        'Caixa Economica Federal - Tecnico Bancario Novo', 'CESGRANRIO', 2024,
        'No contexto de educacao financeira, o habito de reservar parte da renda antes do consumo contribui para',
        'o aumento do endividamento impulsivo',
        'a formacao de reserva financeira',
        'a eliminacao imediata de todos os riscos',
        'a dispensa de planejamento',
        'o uso obrigatorio de credito rotativo',
        'B', 'Conhecimentos Bancarios', 'Educacao financeira'
      ),
      (
        'TSE Unificado - Tecnico Judiciario', 'CEBRASPE', 2024,
        'A linguagem simples na comunicacao institucional favorece',
        'a dificuldade de acesso a informacao',
        'a compreensao do conteudo pelo cidadao',
        'o uso de termos obscuros como regra',
        'a reducao da transparencia publica',
        'a supressao de dados essenciais',
        'B', 'Redacao Oficial', 'Linguagem simples'
      ),
      (
        'TRT-2 - Tecnico Judiciario', 'FCC', 2022,
        'O direito ao contraditorio e a ampla defesa aplica-se, em regra, aos processos',
        'judiciais e administrativos',
        'somente legislativos',
        'apenas eleitorais',
        'somente internos de empresas privadas',
        'apenas criminais',
        'A', 'Direito Constitucional', 'Garantias fundamentais'
      ),
      (
        'Prefeitura de Belo Horizonte - Assistente Administrativo', 'IBFC', 2023,
        'No Excel, a formula usada para somar os valores do intervalo A1 ate A5, na versao em portugues, e',
        '=MEDIA(A1:A5)',
        '=CONT.SE(A1:A5)',
        '=SOMA(A1:A5)',
        '=MAXIMO(A1:A5)',
        '=SE(A1:A5)',
        'C', 'Informatica', 'Planilhas eletronicas'
      ),
      (
        'Policia Civil SP - Escrivao', 'VUNESP', 2023,
        'No atendimento ao cidadao em unidade policial, o registro fiel das informacoes e importante porque',
        'dispensa a conferencia posterior',
        'reduz a necessidade de identificacao das partes',
        'compromete a formalidade do procedimento',
        'contribui para a confiabilidade do procedimento',
        'substitui a decisao da autoridade policial',
        'D', 'Atendimento', 'Atendimento ao publico'
      )
  ) as questions(
    concurso,
    banca,
    ano,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_e,
    correta,
    discipline,
    topic
  )
)
insert into public.questions (
  exam_id,
  enunciado,
  alternativa_a,
  alternativa_b,
  alternativa_c,
  alternativa_d,
  alternativa_e,
  correta,
  discipline,
  topic
)
select
  e.id,
  q.enunciado,
  q.alternativa_a,
  q.alternativa_b,
  q.alternativa_c,
  q.alternativa_d,
  q.alternativa_e,
  q.correta,
  q.discipline,
  q.topic
from question_bank q
join target_exams e
  on e.concurso = q.concurso
 and e.banca = q.banca
 and e.ano = q.ano
where not exists (
  select 1
  from public.questions existing
  where existing.exam_id = e.id
    and existing.enunciado = q.enunciado
);
