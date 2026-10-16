const express = require('express');
const app = express();
app.use(express.json());
// ALERTA DE SEGURANÇA: Banco de dados em memória (Array)
// Os dados somem ao reiniciar o servidor porque a memória RAM é volátil. 
// Além disso, se sofrer um ataque que lote o array, o servidor cai por falta de memória.


// "Banco de dados" em memória (Exercício 1: Campo prioridade adicionado)
let tarefas = [
  { id: 1, titulo: 'Aprender Express', concluida: false, prioridade: 'alta' },
  { id: 2, titulo: 'Criar minha primeira API', concluida: false, prioridade: 'média' }
];
let proximoId = 3;
// FALHA 06 (Falta de Limites): Não há "Rate Limiting" configurado aqui. 
// Um único robô pode fazer milhares de requisições por segundo e travar a API.
// FALHA 04 (Ausência de Autenticação): Qualquer pessoa na internet que acessar esse 
// link consegue ver o resumo de tarefas do sistema, violando a privacidade dos dados.

// Exercício 2: Endpoint GET /tarefas/resumo
// IMPORTANTE: Deve vir ANTES de GET /tarefas/:id para o Express não achar que "resumo" é um ID.
app.get('/tarefas/resumo', (req, res) => {
  const concluidas = tarefas.filter(t => t.concluida === true).length;
  const pendentes = tarefas.filter(t => t.concluida === false).length;
  
  res.json({
    total: tarefas.length,
    concluidas,
    pendentes
  });
});

// LISTAR todas as tarefas (com filtro opcional por status)
app.get('/tarefas', (req, res) => {
  const { concluida } = req.query;
  let resultado = tarefas;
  if (concluida !== undefined) {
    resultado = tarefas.filter(t => t.concluida === (concluida === 'true'));
  }
  res.json(resultado);
});

// BUSCAR uma tarefa específica
app.get('/tarefas/:id', (req, res) => {
  const tarefa = tarefas.find(t => t.id === parseInt(req.params.id));
  if (!tarefa) return res.status(404).json({ erro: 'Tarefa nao encontrada' });
  res.json(tarefa);
});

// CRIAR uma nova tarefa (Exercício 1 e 3: Prioridade e Validações)
app.post('/tarefas', (req, res) => {
  const { titulo, prioridade } = req.body;

  
  // FALHA 02 (Validação de Entrada Incompleta):
  // O código barra apenas títulos vazios. Mas ele aceita:
  // 1. Um texto gigante de 50 milhões de caracteres (Ataque de Negação de Serviço).
  // 2. Um código de programação como <script>alert('hackado')</script> (Ataque XSS).
  // 3. Tipos de dados errados (como enviar um número ou um objeto no lugar do título).
 

  // Validação: impede título vazio ou apenas com espaços
  if (!titulo || titulo.trim() === '') {
    return res.status(400).json({ erro: 'O campo "titulo" é obrigatório e não pode ser vazio' });
  }

  // Validação: impede títulos repetidos (ignora espaços extras nas pontas)
  const tituloRepetido = tarefas.some(t => t.titulo.toLowerCase().trim() === titulo.toLowerCase().trim());
  if (tituloRepetido) {
    return res.status(400).json({ erro: 'Já existe uma tarefa com este título' });
  }

  // Validação opcional: garante prioridade padrão caso não seja enviada ou seja inválida
  const prioridadesValidas = ['baixa', 'média', 'alta'];
  const prioridadeDefinida = prioridadesValidas.includes(prioridade) ? prioridade : 'baixa';

  const novaTarefa = { 
    id: proximoId++, 
    titulo: titulo.trim(), 
    concluida: false,
    prioridade: prioridadeDefinida
  };

  tarefas.push(novaTarefa);
  res.status(201).json(novaTarefa);
});


// FALHA 04 CRÍTICA (Controle de Acesso Quebrado):
// Qualquer usuário anônimo pode disparar esse método DELETE e apagar as 
// tarefas concluídas de TODO MUNDO do sistema de uma vez só, sem precisar de login.


// Exercício 4: Endpoint DELETE /tarefas (Apaga todas as concluídas)
app.delete('/tarefas', (req, res) => {
  // Filtra a lista mantendo apenas o que NÃO está concluído
  tarefas = tarefas.filter(t => t.concluida === false);
  res.json({ mensagem: 'Todas as tarefas concluídas foram removidas com sucesso' });
});

// ATUALIZAR uma tarefa (ex: marcar como concluída)
app.put('/tarefas/:id', (req, res) => {
  const tarefa = tarefas.find(t => t.id === parseInt(req.params.id));
  if (!tarefa) return res.status(404).json({ erro: 'Tarefa nao encontrada' });
  
  const { titulo, concluida, prioridade } = req.body;
  // FALHA DE VALIDAÇÃO: Aceita qualquer tipo de dado enviado no corpo da requisição.
  // Se o atacante enviar um objeto complexo em "concluida", pode corromper a lógica do array.
  if (titulo !== undefined) tarefa.titulo = titulo;
  if (concluida !== undefined) tarefa.concluida = concluida;
  if (prioridade !== undefined) tarefa.prioridade = prioridade;

  res.json(tarefa);
});

// Inicialização do servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
