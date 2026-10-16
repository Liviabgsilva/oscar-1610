const express = require('express');
const pool = require('./db');
const app = express();
app.use(express.json());
// LISTAR tarefas (com filtro opcional por status)
app.get('/tarefas', async (req, res) => {
 try {
 const { concluida } = req.query;
 let query = 'SELECT * FROM tarefas';
 let params = [];
 if (concluida !== undefined) {
 query += ' WHERE concluida = $1';
 params.push(concluida === 'true');
 }
 query += ' ORDER BY id';
 const resultado = await pool.query(query, params);
 res.json(resultado.rows);
 } catch (error) {
 console.error(error);
 res.status(500).json({ erro: 'Erro ao buscar tarefas' });
 }
});
// BUSCAR uma tarefa especifica
app.get('/tarefas/:id', async (req, res) => {
 const{ prioridade } = req.query;
 let query = 'SELECT * FROM tarefas ';
const params = [];
if (prioridade) {
    query += 'WHERE prioridade = $1';
    params.push(prioridade);
}
try{
    const resultado = await db.query(query, params);
    res.json(resultado .rows || resultado);
}catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar tarefas' });
}
});
// CRIAR uma nova tarefa
app.post('/tarefas', async (req, res) => {
 try {
 const { titulo } = req.body;
 if (!titulo) return res.status(400).json({ erro: 'O campo "titulo" e obrigatorio' });
 const resultado = await pool.query(
 'INSERT INTO tarefas (titulo) VALUES ($1) RETURNING *',
 [titulo]
 );
 res.status(201).json(resultado.rows[0]);
 } catch (error) {
 console.error(error);
 res.status(500).json({ erro: 'Erro ao criar tarefa' });
 }
});
// ATUALIZAR uma tarefa
app.put('/tarefas/:id', async (req, res) => {
 try {
 const { titulo, concluida } = req.body;
 const tarefaAtual = await pool.query('SELECT * FROM tarefas WHERE id = $1', [req.params.id]);
 if (tarefaAtual.rows.length === 0) {
 return res.status(404).json({ erro: 'Tarefa nao encontrada' });
 }
 const atual = tarefaAtual.rows[0];
 const novoTitulo = titulo !== undefined ? titulo : atual.titulo;
 const novaConcluida = concluida !== undefined ? concluida : atual.concluida;
 const resultado = await pool.query(
 'UPDATE tarefas SET titulo = $1, concluida = $2 WHERE id = $3 RETURNING *',
 [novoTitulo, novaConcluida, req.params.id]
 );
 res.json(resultado.rows[0]);
 } catch (error) {
 console.error(error);
 res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
 }
});
// DELETAR uma tarefa
app.delete('/tarefas/:id', async (req, res) => {
  try {
    // 1. Pegamos o ID enviado na URL
    const { id } = req.params; 

    // 2. Executamos o comando SQL passando o ID dentro do array [id]
    const resultado = await db.query('DELETE FROM tarefas WHERE id = $1 RETURNING *', [id]); 

    // 3. Se o banco não encontrar nenhuma linha deletada, retorna 404
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Tarefa nao encontrada' });
    }
        res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao deletar tarefa' });
  }
});