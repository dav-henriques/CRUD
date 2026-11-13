/* ============================================================
   CONTEÚDO DA OFICINA: aulas, exercícios, anotações, entidades.
   O código original vem de window.ORIG (gerado pelo build a partir
   dos arquivos reais do projeto). Nada aqui é executado como C#.
   ============================================================ */

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BADGE = {
  orig: 'Original da professora',
  melhoria: 'Melhoria — não está no original',
  adaptado: 'Exemplo adaptado (outro tema)',
  equiv: 'Versão equivalente — não está no original',
  pseudo: 'Raciocínio em português — não é C#',
  erro: 'Código com erro, para estudo',
  sql: 'SQL'
};
const code = (lang, text, kind = 'adaptado', label = '') =>
  `<div class="codewrap k-${kind}"><div class="codebadge"><span>${BADGE[kind]}</span>${label ? `<span class="cb-label">${esc(label)}</span>` : ''}</div><pre class="code" data-lang="${lang}">${esc(text.replace(/^\n/, ''))}</pre></div>`;
const snip = (f, from, to = '', extra = 0, hl = '') => `<div data-snip="${esc([f, from, to, extra, hl].join('|'))}"></div>`;
const ex = id => `<div data-ex="${id}"></div>`;
const widget = (name, arg = '') => `<div data-widget="${name}" data-arg="${esc(arg)}"></div>`;
const note = (kind, title, html) => `<aside class="note n-${kind}"><strong>${title}</strong><div>${html}</div></aside>`;
const sec = (kind, title, html) => `<section class="lsec s-${kind}"><h2><span class="sec-tag">${{ex: 'Explicação', proj: 'No projeto', int: 'Experimente', exr: 'Pratique'}[kind]}</span>${title}</h2>${html}</section>`;

/* ------------------------------------------------------------
   AULAS
   ------------------------------------------------------------ */
const LESSONS = [
{
  id: 'aula-1', stage: 'Entender o CRUD', title: 'O que é CRUD e onde os dados moram', min: 12,
  html: `
${sec('ex', 'Quatro operações, quatro comandos', `
<p>Quase todo sistema de cadastro faz as mesmas quatro coisas com os dados. A sigla <strong>CRUD</strong> junta as iniciais em inglês:</p>
<div class="tablewrap"><table class="t">
<thead><tr><th>Letra</th><th>Em inglês</th><th>Na tela</th><th>Comando SQL</th><th>Método no projeto</th></tr></thead>
<tbody>
<tr><td><b class="crud c">C</b></td><td>Create</td><td>Cadastrar</td><td><code>INSERT</code></td><td><code>InserirAluno()</code></td></tr>
<tr><td><b class="crud r">R</b></td><td>Read</td><td>Listar (mostrar na tabela)</td><td><code>SELECT</code></td><td><code>ListarAlunos()</code></td></tr>
<tr><td><b class="crud u">U</b></td><td>Update</td><td>Alterar</td><td><code>UPDATE</code></td><td><code>AlterarAluno()</code></td></tr>
<tr><td><b class="crud d">D</b></td><td>Delete</td><td>Excluir</td><td><code>DELETE</code></td><td><code>ExcluirAluno()</code></td></tr>
</tbody></table></div>
<p>Na prova o tema muda (times, produtos, livros...), mas essas quatro operações continuam iguais. O que muda são os nomes e as colunas.</p>
<h3>Vocabulário da tabela</h3>
<dl class="terms">
<dt>Tabela</dt><dd>Um conjunto de dados do mesmo tipo. Aqui, <code>tblAlunos</code>.</dd>
<dt>Coluna (campo)</dt><dd>Uma característica que todo registro tem: <code>nome</code>, <code>dtnasc</code>, <code>turma</code>...</dd>
<dt>Registro (linha)</dt><dd>Um aluno completo, com um valor em cada coluna.</dd>
<dt>Chave primária</dt><dd>A coluna que identifica cada registro sem repetir. Aqui é <code>id</code>. Dois alunos podem ter o mesmo nome, mas nunca o mesmo <code>id</code>.</dd>
<dt>auto_increment</dt><dd>O MySQL escolhe o próximo número do <code>id</code> sozinho. Por isso o INSERT do projeto manda <code>null</code> no lugar do id. Números de registros excluídos não são reaproveitados.</dd>
</dl>
`)}
${sec('proj', 'O script do banco', `
<p>Este é o script que a professora usa para criar o banco e a tabela. Cada linha dentro de <code>create table</code> vira uma coluna.</p>
${snip('Script_DBEscola.sql', 'create database', 'select * from')}
<h3>Três lugares diferentes</h3>
<p>Uma confusão comum é achar que a tabela que aparece na tela <em>é</em> o banco. São três coisas separadas:</p>
<div class="layers">
  <div class="layer l-db"><b>Banco de dados (MySQL)</b><span>Onde os dados ficam guardados de verdade, mesmo depois de fechar o programa. Banco <code>DB_EscolaCRUD</code>, tabela <code>tblAlunos</code>.</span></div>
  <div class="layer-arrow" aria-hidden="true">⇄</div>
  <div class="layer l-app"><b>Aplicação Windows Forms (C#)</b><span>O programa: a janela, os botões e o código que monta o SQL e manda para o banco.</span></div>
  <div class="layer-arrow" aria-hidden="true">⇄</div>
  <div class="layer l-grid"><b>DataGridView (<code>dtgAlunos</code>)</b><span>Um controle da janela que <em>mostra uma cópia</em> do resultado do último SELECT. Se o banco mudar e ninguém fizer outro SELECT, a cópia fica velha.</span></div>
</div>
`)}
${sec('int', 'Mexa numa tabela pequena', `
<p>Clique numa célula para ver o nome de cada parte. Depois use os botões: cada um mostra o SQL que faria aquilo no banco.</p>
${widget('crudMini')}
`)}
${sec('exr', 'Exercícios', ex('e1') + ex('e2') + ex('e3'))}
`},
{
  id: 'aula-2', stage: 'Organização do projeto', title: 'Quem faz o quê: os arquivos do projeto', min: 12,
  html: `
${sec('ex', 'Cada arquivo tem um trabalho', `
<p>O projeto separa responsabilidades. Pense numa lanchonete: o atendente (formulário) anota o pedido, a comanda (objeto Aluno) guarda os dados do pedido e o cozinheiro (Conexao) leva tudo até a cozinha (MySQL).</p>
<div class="tablewrap"><table class="t">
<thead><tr><th>Arquivo</th><th>Responsabilidade</th><th>Você escreve?</th></tr></thead>
<tbody>
<tr><td><code>Script_DBEscola.sql</code></td><td>Cria o banco <code>DB_EscolaCRUD</code> e a tabela <code>tblAlunos</code>. Roda no MySQL (Workbench, phpMyAdmin...), não no C#.</td><td>Sim</td></tr>
<tr><td><code>Program.cs</code></td><td>Ponto de entrada: abre a primeira janela, <code>FrmPrincipal</code>.</td><td>Gerado pelo Visual Studio</td></tr>
<tr><td><code>FrmPrincipal.cs</code></td><td>Menu principal. O item ALUNOS abre o <code>FrmAlunos</code> com <code>ShowDialog()</code>.</td><td>Sim (os eventos do menu)</td></tr>
<tr><td><code>FrmAlunos.cs</code></td><td>Eventos dos botões e da tabela: lê os controles, chama os métodos do aluno e atualiza a tela.</td><td>Sim</td></tr>
<tr><td><code>FrmAlunos.designer.cs</code></td><td>Cria e posiciona os controles e liga os eventos aos métodos. É escrito pelo Designer quando você arrasta e configura controles.</td><td>Não edite à mão</td></tr>
<tr><td><code>Aluno.cs</code></td><td>Atributos privados (um por coluna), métodos Get/Set e os métodos do CRUD que montam o SQL.</td><td>Sim</td></tr>
<tr><td><code>Conexao.cs</code></td><td>Abre e fecha a conexão com o MySQL e executa o SQL que recebe.</td><td>Sim</td></tr>
</tbody></table></div>
<p>A biblioteca <code>MySql.Data</code> (pacote NuGet) é o que fornece <code>MySqlConnection</code>, <code>MySqlCommand</code> e <code>MySqlDataAdapter</code>. Sem ela, o <code>using MySql.Data.MySqlClient;</code> dá erro.</p>
<h3>Ida e volta</h3>
<p><b>Ida:</b> o formulário lê os controles → guarda os valores no objeto <code>objAluno</code> com os Set → chama um método como <code>InserirAluno()</code> → esse método monta o SQL e entrega para <code>db.ExecutarComando()</code> → a Conexao executa no MySQL.</p>
<p><b>Volta:</b> o formulário chama <code>MostrarDadosAlunos()</code> → que chama <code>objAluno.ListarAlunos()</code> → que chama <code>db.ExecutarConsulta()</code> → o MySQL devolve as linhas, que viram um <code>DataTable</code> → o DataTable volta até o formulário e é colocado no <code>dtgAlunos.DataSource</code>.</p>
`)}
${sec('proj', 'Como o programa chega até o FrmAlunos', `
${snip('Program.cs', 'static void Main()', 'Application.Run', 1)}
${snip('FrmPrincipal.cs', 'private void aLUNOSToolStripMenuItem_Click', 'telaAlunos.ShowDialog();', 1)}
<p><code>ShowDialog()</code> abre a janela como <em>modal</em>: enquanto o FrmAlunos estiver aberto, o menu principal fica esperando. Ao abrir, o FrmAlunos dispara o evento <code>Load</code>, que carrega a tabela.</p>
`)}
${sec('int', 'Siga os dados entre as classes', `${widget('fluxo')}`)}
${sec('exr', 'Exercícios', ex('e4') + ex('e5') + ex('e6'))}
`},
{
  id: 'aula-3', stage: 'Montar o formulário', title: 'Controles, nomes e eventos', min: 15,
  html: `
${sec('ex', 'Escolhendo o controle certo', `
<p>Cada coluna da tabela precisa de um jeito de o usuário informar o valor. A escolha depende do tipo de dado:</p>
<div class="tablewrap"><table class="t">
<thead><tr><th>Coluna</th><th>Controle</th><th>Name no projeto</th><th>O código lê</th></tr></thead>
<tbody>
<tr><td>id</td><td>TextBox desabilitado</td><td><code>txtID</code></td><td><code>txtID.Text</code></td></tr>
<tr><td>nome</td><td>TextBox</td><td><code>txtNome</code></td><td><code>txtNome.Text</code></td></tr>
<tr><td>dtnasc</td><td>DateTimePicker</td><td><code>dtpNascimento</code></td><td><code>dtpNascimento.Value</code></td></tr>
<tr><td>unidade</td><td>2 RadioButtons dentro do GroupBox <code>grpUnidade</code></td><td><code>rdbBarroca</code>, <code>rdbFloresta</code></td><td><code>.Checked</code></td></tr>
<tr><td>serie</td><td>3 RadioButtons dentro do GroupBox <code>grpSerie</code></td><td><code>rdb1Serie</code>, <code>rdb2Serie</code>, <code>rdb3Serie</code></td><td><code>.Checked</code></td></tr>
<tr><td>turma</td><td>ComboBox (DropDownList, itens A–E)</td><td><code>cmbTurma</code></td><td><code>cmbTurma.Text</code></td></tr>
<tr><td>—</td><td>DataGridView</td><td><code>dtgAlunos</code></td><td>recebe <code>.DataSource</code></td></tr>
<tr><td>—</td><td>Buttons</td><td><code>btnCadastrar</code>, <code>btnAlterar</code>, <code>btnExcluir</code>, <code>btnLimpar</code>, <code>btnSair</code></td><td>evento Click</td></tr>
</tbody></table></div>
<h3>Name não é Text</h3>
<p><b>Name</b> é o nome do controle <em>no código</em> (<code>btnCadastrar</code>). <b>Text</b> é o que aparece <em>na tela</em> (“Cadastrar”). Se o código usa <code>txtNome</code> e o controle se chama <code>textBox1</code>, o projeto não compila. Mude o Name na janela Propriedades <em>antes</em> de criar os eventos.</p>
<p>Os prefixos (<code>txt</code>, <code>dtp</code>, <code>rdb</code>, <code>cmb</code>, <code>grp</code>, <code>dtg</code>, <code>btn</code>, <code>lbl</code>) não são obrigatórios para o C#, mas ajudam a saber o tipo do controle só pelo nome.</p>
<h3>Por que GroupBox?</h3>
<p>RadioButtons que estão no mesmo container formam um grupo: marcar um desmarca os outros. Se os 5 RadioButtons ficassem soltos no mesmo painel, marcar “2ª” desmarcaria “Barroca”. Por isso a unidade fica em <code>grpUnidade</code> e a série em <code>grpSerie</code>.</p>
<h3>Ligando eventos no Visual Studio</h3>
<ol class="steps">
<li>No Designer, selecione o controle (por exemplo, o botão Cadastrar).</li>
<li>Na janela <b>Propriedades</b>, clique no ícone de raio <b>⚡ (Eventos)</b>.</li>
<li>Encontre o evento (<b>Click</b>) e dê dois cliques no espaço ao lado. O Visual Studio cria <code>btnCadastrar_Click</code> no <code>FrmAlunos.cs</code> e escreve a ligação no designer.</li>
<li>Escreva o código <em>dentro</em> das chaves do método criado.</li>
</ol>
<p>Atalho: dois cliques no próprio controle criam o <em>evento padrão</em>. No Button é Click e no formulário é Load. <strong>Cuidado com o DataGridView:</strong> dois cliques nele criam <code>CellContentClick</code>, que só dispara ao clicar no conteúdo da célula. O projeto usa <code>CellClick</code>, escolhido pelo ⚡.</p>
`)}
${sec('proj', 'O que o Designer escreveu por você', `
<p>Estas linhas estão no <code>FrmAlunos.designer.cs</code>. Elas ligam cada evento ao método que você escreveu. Você não digita isso: o Visual Studio gera ao associar o evento.</p>
${snip('FrmAlunos.designer.cs', 'this.btnCadastrar.Name = "btnCadastrar";', 'this.btnCadastrar.Click +=', 0, 'Name =;;Text =;;Click +=')}
${snip('FrmAlunos.designer.cs', 'this.dtgAlunos.CellClick +=')}
${snip('FrmAlunos.designer.cs', 'this.Load += new System.EventHandler(this.FrmAlunos_Load);')}
${note('tip', 'Onde escrever cada coisa', '<p>Seu código vai no <code>FrmAlunos.cs</code> (botão direito no formulário → <b>Exibir Código</b>, ou F7). O <code>FrmAlunos.designer.cs</code> é do Designer. As duas partes formam a mesma classe porque ambas são <code>partial class FrmAlunos</code>.</p>')}
`)}
${sec('int', 'Inspecione os controles', `<p>Clique em cada controle da janela para ver o tipo, o Name, o Text e como o código usa.</p>${widget('inspetor')}`)}
${sec('exr', 'Exercícios', ex('e7') + ex('e8') + ex('e9'))}
`},
{
  id: 'aula-4', stage: 'Criar a classe Aluno', title: 'Classe, objeto, Get e Set', min: 15,
  html: `
${sec('ex', 'O molde e a ficha preenchida', `
<p>Uma <b>classe</b> é um molde. <code>Aluno</code> descreve quais dados um aluno tem e o que dá para fazer com eles. Um <b>objeto</b> é uma ficha feita a partir do molde, com valores de verdade.</p>
<dl class="terms">
<dt>Atributo</dt><dd>Uma variável que pertence ao objeto. Em <code>Aluno</code>: <code>id</code>, <code>serie</code>, <code>nome</code>, <code>turma</code>, <code>unidade</code>, <code>dtnasc</code>, um para cada coluna da tabela.</dd>
<dt><code>private</code></dt><dd>Só o código de dentro da classe enxerga. O formulário não pode escrever <code>objAluno.nome = "Ana"</code>.</dd>
<dt><code>public</code></dt><dd>Qualquer classe do projeto pode chamar. Os Get/Set e os métodos do CRUD são públicos.</dd>
<dt>Método</dt><dd>Um bloco de código com nome, que roda quando é chamado: <code>SetNome(...)</code>, <code>InserirAluno()</code>.</dd>
<dt>Parâmetro</dt><dd>Valor que o método recebe entre parênteses. Em <code>SetNome(string nome)</code>, o parâmetro se chama <code>nome</code> e é do tipo <code>string</code>.</dd>
<dt>Retorno</dt><dd>Valor que o método devolve com <code>return</code>. <code>GetNome()</code> devolve uma <code>string</code>.</dd>
<dt><code>void</code></dt><dd>“Não devolve nada.” Os Set só guardam um valor, então são <code>void</code>.</dd>
<dt><code>this</code></dt><dd>“Este objeto.” Em <code>this.nome = nome;</code>, o da esquerda é o atributo e o da direita é o parâmetro. Como os dois têm o mesmo nome, o <code>this</code> desfaz a dúvida.</dd>
</dl>
<h3>Por que Get e Set?</h3>
<p>Como os atributos são privados, a classe oferece portas de entrada e saída: o <b>Set</b> recebe um valor e guarda no atributo, o <b>Get</b> devolve o valor guardado. Isso se chama <b>encapsulamento</b>. Toda coluna ganha um par.</p>
`)}
${sec('proj', 'No Aluno.cs', `
${snip('Aluno.cs', '// Atributos da classe', 'private DateTime dtnasc;')}
${snip('Aluno.cs', 'public void setId(int id)', 'return this.id;', 1)}
${note('warn', 'Repare no setId', '<p>No original, <code>setId</code> começa com <b>s minúsculo</b>, e os outros (<code>SetNome</code>, <code>SetSerie</code>...) com maiúsculo. O C# diferencia maiúsculas e minúsculas, então no formulário é preciso escrever <code>objAluno.setId(...)</code> exatamente assim. Num projeto novo, você pode padronizar como <code>SetId</code>, desde que use o mesmo nome em todo lugar.</p>')}
<p>No formulário, a ficha é criada uma vez, como um campo da classe <code>FrmAlunos</code>. Todos os botões usam o mesmo <code>objAluno</code>:</p>
${snip('FrmAlunos.cs', '//Instanciar a classe Aluno', 'Aluno objAluno = new Aluno();')}
<p>Leia assim: <code>Aluno</code> (tipo) <code>objAluno</code> (nome da variável) <code>=</code> <code>new Aluno()</code> (crie uma ficha nova a partir do molde). Dentro de <code>Aluno</code> acontece o mesmo com a conexão: <code>Conexao db = new Conexao();</code>.</p>
`)}
${sec('int', 'Crie um objeto e chame os métodos', widget('objeto'))}
${sec('exr', 'Exercícios', ex('e10') + ex('e11') + ex('e12'))}
`},
{
  id: 'aula-5', stage: 'Conectar ao banco', title: 'A classe Conexao, peça por peça', min: 15,
  html: `
${sec('ex', 'Abrir, executar, fechar', `
<p>A <code>Conexao</code> sempre faz a mesma sequência: <b>abrir</b> a conexão, <b>executar</b> o SQL que recebeu e <b>fechar</b>. Ela não sabe nada sobre alunos. Recebe um texto SQL pronto e executa.</p>
<h3>A string de conexão</h3>
<p>É o endereço e a senha do banco, num texto só. Clique em cada parte:</p>
${widget('connstr')}
<h3>Os objetos do MySql.Data</h3>
<dl class="terms">
<dt><code>MySqlConnection</code></dt><dd>Representa a ligação com o servidor. <code>Open()</code> conecta, <code>Close()</code> desconecta.</dd>
<dt><code>MySqlCommand</code> + <code>ExecuteNonQuery()</code></dt><dd>Para <b>INSERT, UPDATE e DELETE</b>. Executa e não traz tabela nenhuma de volta. O método retorna um <code>int</code> com a quantidade de linhas afetadas, mas o projeto original ignora esse número.</dd>
<dt><code>MySqlDataAdapter</code> + <code>DataTable</code> + <code>Fill()</code></dt><dd>Para <b>SELECT</b>. O adapter executa a consulta e o <code>Fill(dt)</code> despeja as linhas do resultado dentro do <code>DataTable</code>, uma tabela em memória que o DataGridView sabe mostrar.</dd>
</dl>
<h3>try, catch, finally e o throw</h3>
<dl class="terms">
<dt><code>try</code></dt><dd>“Tente executar isto.”</dd>
<dt><code>catch (MySqlException ex)</code></dt><dd>“Se o MySQL reclamar, venha para cá.” <code>ex.Message</code> tem o texto do erro.</dd>
<dt><code>finally</code></dt><dd>“Rode isto sempre, deu certo ou não.” É onde a conexão é fechada. Roda até quando o <code>try</code> faz <code>return</code> ou o <code>catch</code> faz <code>throw</code>.</dd>
<dt><code>throw new Exception(...)</code></dt><dd>Lança um erro novo, com uma mensagem mais clara, para quem chamou. O erro sobe: Conexao → Aluno → FrmAlunos. Como os botões do original não têm <code>try/catch</code>, ele chega ao Windows Forms como <b>exceção não tratada</b>. No Visual Studio a execução para na linha; fora dele aparece a janela de erro do .NET.</dd>
</dl>
`)}
${sec('proj', 'O código da Conexao', `
${snip('Conexao.cs', '//Criação do objeto de conexão:', 'MySqlConnection conn;')}
${snip('Conexao.cs', 'private void Conectar()', 'throw new Exception($"A conexão', 2)}
${snip('Conexao.cs', 'public void ExecutarComando(string sql)', 'conn.Close();', 2, 'ExecuteNonQuery')}
${snip('Conexao.cs', 'public DataTable ExecutarConsulta(string query)', 'conn.Close();', 2, 'MySqlDataAdapter;;new DataTable;;Fill;;return dt')}
`)}
${sec('int', 'Veja o caminho do try/catch/finally', widget('tryflow'))}
${sec('exr', 'Exercícios', ex('e13') + ex('e14') + ex('e15'))}
`},
{
  id: 'aula-6', stage: 'Cadastrar', title: 'Cadastrar: da tela até o INSERT', min: 18,
  html: `
${sec('ex', 'O roteiro do botão Cadastrar', `
<ol class="steps">
<li><b>Ler os controles</b> e guardar em variáveis, já no tipo certo.</li>
<li><b>Converter</b> o que precisa: texto da turma vira <code>char</code>, RadioButton marcado vira letra ou número.</li>
<li><b>Preencher o objeto</b> com os Set.</li>
<li><b>Chamar <code>objAluno.InserirAluno()</code></b>, que monta o INSERT e manda para a Conexao.</li>
<li><b>Atualizar a tela:</b> recarregar a tabela, avisar o usuário e limpar os campos.</li>
</ol>
<h3>Lendo cada controle</h3>
<dl class="terms">
<dt><code>txtNome.Text</code></dt><dd>O texto digitado, uma <code>string</code>.</dd>
<dt><code>dtpNascimento.Value</code></dt><dd>A data escolhida, já como <code>DateTime</code>. Não precisa converter.</dd>
<dt><code>rdbBarroca.Checked</code></dt><dd><code>true</code> se o RadioButton está marcado, <code>false</code> se não.</dd>
<dt><code>char.Parse(cmbTurma.Text)</code></dt><dd>Transforma o texto <code>"A"</code> no caractere <code>'A'</code>. Só funciona se o texto tiver exatamente 1 caractere. Com a turma vazia, lança <code>FormatException</code>.</dd>
</dl>
<h3>O INSERT montado por interpolação</h3>
<p>O <code>$</code> antes das aspas cria uma <b>string interpolada</b>: o que está entre <code>{ }</code> é trocado pelo valor da variável. Os apóstrofos <code>' '</code> fazem parte do SQL e marcam texto para o MySQL.</p>
<p><code>dtnasc.ToString("yyyy/MM/dd")</code> escreve a data como ano/mês/dia (por exemplo <code>2009/03/15</code>), que o MySQL aceita numa coluna <code>date</code>. No formato de formatação do C#, a <code>/</code> usa o separador de data do Windows. No português do Brasil, ele é a própria barra.</p>
`)}
${sec('proj', 'O código real', `
${snip('FrmAlunos.cs', 'private void btnCadastrar_Click', 'LimparDados();', 1)}
${snip('Aluno.cs', 'public void InserirAluno()', 'db.ExecutarComando(inserir);', 1, 'INSERT')}
<h3>O ternário da série</h3>
<p>A linha da série usa o <b>operador ternário</b> <code>condição ? valorSeVerdadeiro : valorSeFalso</code>, encadeado três vezes:</p>
${snip('FrmAlunos.cs', 'serieAluno = rdb1Serie.Checked ?')}
${code('cs', `
// Mesma lógica, escrita com if/else
if (rdb1Serie.Checked)
    serieAluno = 1;
else if (rdb2Serie.Checked)
    serieAluno = 2;
else if (rdb3Serie.Checked)
    serieAluno = 3;
else
    serieAluno = 0;`, 'equiv')}
<p>As duas formas fazem a mesma coisa. Se nenhuma série estiver marcada, o original grava <code>0</code>. Na unidade, sem seleção, grava <code>' '</code> (espaço). O original não valida isso.</p>
`)}
${sec('int', 'Monte o INSERT ao vivo', `<p>Mude os valores e veja as variáveis e o SQL que o código montaria, com a mesma regra do original.</p>${widget('montaInsert')}`)}
${sec('exr', 'Exercícios', ex('e16') + ex('e17') + ex('e18'))}
`},
{
  id: 'aula-7', stage: 'Listar e selecionar', title: 'Listar no DataGridView e selecionar uma linha', min: 15,
  html: `
${sec('ex', 'Do SELECT até a grade', `
<ol class="steps">
<li><code>ListarAlunos()</code> monta <code>SELECT * FROM tblAlunos ORDER BY nome;</code> e chama <code>db.ExecutarConsulta()</code>.</li>
<li>A Conexao preenche um <code>DataTable</code> com o resultado e devolve.</li>
<li><code>MostrarDadosAlunos()</code> coloca esse DataTable em <code>dtgAlunos.DataSource</code>. A grade cria uma coluna para cada coluna do SELECT, com os mesmos nomes: <code>id</code>, <code>nome</code>, <code>dtnasc</code>, <code>unidade</code>, <code>serie</code>, <code>turma</code>.</li>
</ol>
<p><code>SELECT *</code> traz todas as colunas. <code>ORDER BY nome</code> ordena em ordem alfabética. Por isso a ordem das linhas na grade <b>não</b> é a ordem dos IDs.</p>
<p>O evento <b>Load</b> roda quando o formulário abre. O original chama <code>MostrarDadosAlunos()</code> nele, então a grade já aparece preenchida. Depois de cada INSERT, UPDATE ou DELETE, chama de novo, para a cópia na tela acompanhar o banco.</p>
<h3>Selecionar: o CellClick</h3>
<p>Quando o usuário clica numa célula, o evento <code>CellClick</code> recebe <code>e</code>, e <code>e.RowIndex</code> diz <b>qual linha da grade</b> foi clicada (0 é a primeira). Com isso o código lê as células daquela linha pelo <b>nome da coluna</b> e copia para os controles.</p>
${note('key', 'Índice da linha ≠ ID do registro', '<p><code>e.RowIndex</code> é a posição na grade, que muda com a ordenação. O <code>id</code> é o número do registro no banco, que nunca muda. Quem vai para o <code>txtID</code> é <code>Cells["id"].Value</code>, o ID de verdade.</p>')}
`)}
${sec('proj', 'O código real', `
${snip('Aluno.cs', 'public DataTable ListarAlunos()', 'return db.ExecutarConsulta(consulta);', 1)}
${snip('FrmAlunos.cs', 'private void FrmAlunos_Load', 'dtgAlunos.DataSource', 1)}
${snip('FrmAlunos.cs', 'private void dtgAlunos_CellClick', 'rdb1Serie.Checked = true;', 2, 'e.RowIndex')}
<p>Repare: unidade e série vêm do banco como texto (<code>"B"</code>, <code>"2"</code>) e o código decide qual RadioButton marcar. O <code>else</code> final marca Floresta ou 1ª série para qualquer outro valor.</p>
`)}
${sec('int', 'Clique na grade', widget('gridIndex'))}
${sec('exr', 'Exercícios', ex('e19') + ex('e20') + ex('e21'))}
`},
{
  id: 'aula-8', stage: 'Alterar, excluir e limpar', title: 'Alterar e excluir com ID e WHERE', min: 15,
  html: `
${sec('ex', 'O ID diz qual registro', `
<p>Cadastrar cria um registro novo, então não precisa de ID: o <code>auto_increment</code> escolhe. Alterar e excluir mexem num registro que <b>já existe</b>, e o banco precisa saber qual. Por isso os dois:</p>
<ol class="steps">
<li>leem <code>txtID.Text</code> (preenchido pelo CellClick) e convertem com <code>int.Parse</code>;</li>
<li>guardam no objeto com <code>objAluno.setId(idAluno)</code>;</li>
<li>usam <code>WHERE id = '...'</code> no SQL.</li>
</ol>
<p>O <b>WHERE</b> é o filtro: “só nas linhas em que o id vale tanto”. <strong>Sem WHERE, o UPDATE altera todas as linhas da tabela e o DELETE apaga todas.</strong> O MySQL não pergunta se você tem certeza. (O MySQL Workbench tem um “safe update mode” que bloqueia isso, mas o programa C# não usa essa proteção.)</p>
<h3>Limpar não apaga nada</h3>
<p><code>LimparDados()</code> só esvazia os controles da tela. Não roda SQL nenhum. O banco e a grade ficam iguais.</p>
<h3>Por que recarregar a grade?</h3>
<p>A grade mostra uma cópia do último SELECT. Depois de um UPDATE ou DELETE, o banco mudou, mas a cópia não. <code>MostrarDadosAlunos()</code> faz um SELECT novo e troca a cópia.</p>
`)}
${sec('proj', 'O código real', `
${snip('Aluno.cs', 'public void AlterarAluno()', 'db.ExecutarComando(alterar);', 1, 'where id')}
${snip('Aluno.cs', 'public void ExcluirAluno()', 'db.ExecutarComando(deletar);', 1, 'WHERE id')}
${snip('FrmAlunos.cs', 'private void btnExcluir_Click', 'MostrarDadosAlunos();', 1, 'int.Parse;;setId')}
${snip('FrmAlunos.cs', 'private void btnAlterar_Click', 'LimparDados();', 1, 'int.Parse;;setId')}
${snip('FrmAlunos.cs', 'private void LimparDados()', 'cmbTurma.SelectedIndex = -1;', 1)}
`)}
${sec('int', 'Laboratório do WHERE', `<p>Uma prévia: nada é gravado. Ligue e desligue o WHERE e veja quantas linhas seriam atingidas.</p>${widget('whereLab')}<h3>Banco atualizado, grade velha</h3>${widget('staleGrid')}`)}
${sec('exr', 'Exercícios', ex('e22') + ex('e23') + ex('e24') + ex('e25') + ex('e29'))}
`},
{
  id: 'aula-9', stage: 'Adaptar para qualquer tema', title: 'Como transformar o modelo para outra tabela', min: 18,
  html: `
${sec('ex', 'Um método em seis passos', `
<p>Na prova, comece pela tabela e só depois abra o Visual Studio. Siga sempre a mesma ordem:</p>
<ol class="steps">
<li><b>Leia a tabela.</b> Liste as colunas e marque qual é a chave primária com <code>auto_increment</code>.</li>
<li><b>Escolha o tipo C#</b> de cada coluna: <code>varchar</code> → <code>string</code>, <code>int</code> → <code>int</code>, <code>date</code> → <code>DateTime</code>, <code>char(1)</code> → <code>char</code>...</li>
<li><b>Escolha o controle</b> de cada coluna e decida o Name (<code>txt</code>, <code>dtp</code>, <code>cmb</code>, <code>rdb</code>, <code>chk</code>).</li>
<li><b>Escreva a classe:</b> atributos privados, um Set e um Get por coluna, e os 4 métodos do CRUD com o nome da tabela nova.</li>
<li><b>Ajuste a Conexao:</b> normalmente só muda o <code>database =</code> da string.</li>
<li><b>Monte o formulário:</b> controles, nomes, eventos Click, Load e CellClick, e os métodos <code>MostrarDados...</code> e <code>LimparDados</code>.</li>
</ol>
<h3>Tabela de renomeação</h3>
<div class="tablewrap"><table class="t">
<thead><tr><th>No exemplo</th><th>Vira (ex.: tabela de produtos)</th></tr></thead>
<tbody>
<tr><td><code>DB_EscolaCRUD</code></td><td><code>DB_LojaCRUD</code></td></tr>
<tr><td><code>tblAlunos</code></td><td><code>tblProdutos</code></td></tr>
<tr><td><code>class Aluno</code> / <code>Aluno.cs</code></td><td><code>class Produto</code> / <code>Produto.cs</code></td></tr>
<tr><td><code>objAluno</code></td><td><code>objProduto</code></td></tr>
<tr><td><code>InserirAluno</code>, <code>AlterarAluno</code>, <code>ExcluirAluno</code></td><td><code>InserirProduto</code>, <code>AlterarProduto</code>, <code>ExcluirProduto</code></td></tr>
<tr><td><code>ListarAlunos</code> / <code>MostrarDadosAlunos</code></td><td><code>ListarProdutos</code> / <code>MostrarDadosProdutos</code></td></tr>
<tr><td><code>FrmAlunos</code> / <code>dtgAlunos</code></td><td><code>FrmProdutos</code> / <code>dtgProdutos</code></td></tr>
<tr><td><code>Conexao</code></td><td><code>Conexao</code> (igual, só muda o banco)</td></tr>
</tbody></table></div>
${note('warn', 'O que costuma pegar na prova', '<ul><li><b>Números com vírgula</b> (<code>decimal</code>): no Brasil o C# escreve <code>12,50</code>, mas o SQL espera <code>12.50</code>. O exemplo da professora não tem esse caso. Veja a solução no decisor abaixo.</li><li><b>Sim/não</b> (<code>tinyint(1)</code> ou <code>boolean</code>): use CheckBox e grave <code>1</code> ou <code>0</code>.</li><li>Os nomes das colunas no <code>Cells["..."]</code> precisam ser iguais aos do banco.</li></ul>')}
`)}
${sec('int', 'Decisor de tipo e controle', `<p>Escolha o tipo da coluna no MySQL e veja o que muda em cada parte do código.</p>${widget('tipoDecisor')}<p>Para praticar com tabelas inteiras, vá ao <a href="#adaptar">Treino de adaptação</a>.</p>`)}
${sec('exr', 'Exercícios', ex('e26') + ex('e27') + ex('e30') + ex('e28'))}
`}
];

/* ------------------------------------------------------------
   EXERCÍCIOS
   Tipos: mc, match, order, fill, code, open
   ------------------------------------------------------------ */
const EXERCISES = {
e1: { type: 'match', title: 'Operação certa para cada pedido',
  q: 'Associe cada pedido do usuário ao comando SQL que o atende.',
  pairs: [['Cadastrar um aluno novo', 'INSERT'], ['Mostrar os alunos no DataGridView', 'SELECT'], ['Corrigir a turma de um aluno', 'UPDATE'], ['Remover um aluno que saiu da escola', 'DELETE']],
  hints: ['Create = criar algo que não existia.', 'Read = só ler, sem mudar nada. Update = mudar algo que já existe.'],
  explain: 'INSERT cria (C), SELECT lê (R), UPDATE altera (U) e DELETE remove (D). No projeto: InserirAluno, ListarAlunos, AlterarAluno e ExcluirAluno.' },
e2: { type: 'mc', title: 'Quem escolhe o id?',
  q: 'No INSERT do projeto, o primeiro valor é <code>null</code>: <code>VALUES (null, \'{nome}\', ...)</code>. Por quê?',
  opts: [
    { t: 'Porque a coluna id é auto_increment: o MySQL gera o número sozinho.', ok: true, why: 'Isso. Ao receber null numa coluna auto_increment, o MySQL usa o próximo número disponível.' },
    { t: 'Porque o aluno novo ainda não tem nome.', why: 'O nome vem logo depois, em <code>\'{nome}\'</code>. O null está na posição da coluna id.' },
    { t: 'Porque o id é opcional e pode ficar vazio na tabela.', why: 'A coluna é <code>not null primary key</code>: nunca fica vazia. O null é só um pedido para o MySQL escolher o número.' },
    { t: 'Porque o C# não sabe trabalhar com números inteiros.', why: 'O C# sabe, sim (<code>int</code>). O motivo está na definição da coluna no script.' }],
  hints: ['Olhe a linha do id no Script_DBEscola.sql.', 'Qual palavra dessa linha faz o banco numerar sozinho?'] },
e3: { type: 'mc', title: 'Tela ou banco?',
  q: 'O DataGridView mostra 5 alunos. Se você apagar uma linha <em>só da grade</em>, sem rodar nenhum DELETE, o que acontece com o banco?',
  opts: [
    { t: 'Nada. O registro continua no banco e volta a aparecer no próximo SELECT.', ok: true, why: 'A grade é uma cópia do resultado do SELECT. Mudar a cópia não muda o original.' },
    { t: 'O registro é apagado do banco automaticamente.', why: 'No projeto, o banco só muda quando a Conexao executa um comando SQL. A grade não faz isso sozinha.' },
    { t: 'O MySQL dá erro de chave primária.', why: 'Nenhum SQL chega ao MySQL nesse caso, então ele nem fica sabendo.' }],
  hints: ['Lembre das três camadas: banco, aplicação e DataGridView.'] },
e4: { type: 'order', title: 'A viagem do Cadastrar',
  q: 'Coloque em ordem o que acontece desde o clique em Cadastrar até a grade mostrar o aluno novo.',
  items: ['O usuário clica em Cadastrar e o evento btnCadastrar_Click roda', 'O formulário lê os controles (txtNome.Text, dtpNascimento.Value...)', 'Os valores vão para o objeto com objAluno.SetNome(...) e os outros Set', 'objAluno.InserirAluno() monta o texto do INSERT', 'db.ExecutarComando(inserir) abre a conexão e executa no MySQL', 'MostrarDadosAlunos() faz um SELECT novo e atualiza o dtgAlunos'],
  hints: ['Tudo começa com um evento e termina na tela.', 'Os Set vêm antes do método InserirAluno, porque ele usa os atributos.'],
  explain: 'Formulário → objeto → Conexao → MySQL, e depois a volta com o SELECT. Essa é a sequência dos 4 botões.' },
e5: { type: 'mc', title: 'Onde mora a string de conexão?',
  q: 'Em qual arquivo está a linha <code>string dadosConexao = "Persist security info = false; server = localhost; ..."</code>?',
  opts: [
    { t: 'Conexao.cs, dentro de Conectar()', ok: true, why: 'Só a Conexao conversa com o MySQL, então só ela precisa do endereço do banco.' },
    { t: 'Aluno.cs', why: 'O Aluno monta o SQL, mas não abre a conexão: ele chama <code>db.ExecutarComando</code>.' },
    { t: 'FrmAlunos.cs', why: 'O formulário cuida da tela. Ele nem sabe que existe um MySQL.' },
    { t: 'Script_DBEscola.sql', why: 'O script roda dentro do MySQL. A string de conexão é usada pelo C# para chegar até ele.' }],
  hints: ['Qual classe tem o objeto MySqlConnection?'] },
e6: { type: 'match', title: 'Cada trecho no seu arquivo',
  q: 'Em qual arquivo cada trecho deve ser escrito?',
  pairs: [['private string nome;', 'Aluno.cs'], ['conn.Open();', 'Conexao.cs'], ['objAluno.SetNome(txtNome.Text);', 'FrmAlunos.cs'], ['this.btnCadastrar.Click += new System.EventHandler(...)', 'FrmAlunos.designer.cs'], ['create table tblAlunos(...)', 'Script_DBEscola.sql'], ['telaAlunos.ShowDialog();', 'FrmPrincipal.cs']],
  hints: ['Atributos e Get/Set ficam na classe da entidade.', 'Quem lê controles (txtNome) é o formulário. Ligação de evento é gerada pelo Designer.'],
  explain: 'Entidade (atributos, Get/Set, SQL) no Aluno.cs; abrir e executar no Conexao.cs; ler controles no FrmAlunos.cs; ligação de eventos no designer; estrutura do banco no script; abrir telas no FrmPrincipal.cs.' },
e7: { type: 'match', title: 'Que propriedade o código lê?',
  q: 'Associe cada controle à propriedade que o código usa para pegar o valor.',
  pairs: [['txtNome (TextBox)', '.Text'], ['dtpNascimento (DateTimePicker)', '.Value'], ['rdbBarroca (RadioButton)', '.Checked'], ['cmbTurma (ComboBox)', '.Text (e depois char.Parse)'], ['dtgAlunos (DataGridView)', '.DataSource (recebe o DataTable)']],
  hints: ['A data já vem como DateTime numa propriedade que não é Text.', 'RadioButton responde “marcado ou não”.'],
  explain: 'TextBox → Text (string); DateTimePicker → Value (DateTime); RadioButton → Checked (bool); ComboBox → Text, convertido com char.Parse; DataGridView recebe dados em DataSource.' },
e8: { type: 'mc', title: 'Name ou Text?',
  q: 'O botão mostra “Cadastrar” na tela e o método se chama <code>btnCadastrar_Click</code>. Em qual propriedade está o valor <code>btnCadastrar</code>?',
  opts: [
    { t: 'Name', ok: true, why: 'Name é o identificador usado no código. O método do evento costuma ser Name + _ + evento.' },
    { t: 'Text', why: 'Text é o “Cadastrar” que aparece no botão. Pode ter espaços e acentos; não é usado para achar o controle no código.' },
    { t: 'Tag', why: 'Tag é um campo livre que o projeto não usa.' }],
  hints: ['Uma das propriedades é para a pessoa ler; a outra, para o código.'] },
e9: { type: 'mc', title: 'O evento certo da grade',
  q: 'Você deu dois cliques no DataGridView e o Visual Studio criou <code>dtgAlunos_CellContentClick</code>. O que fazer para ficar igual ao projeto?',
  opts: [
    { t: 'Selecionar a grade, abrir Propriedades → ⚡ Eventos e dar dois cliques em CellClick.', ok: true, why: 'O projeto usa CellClick, que dispara em qualquer ponto da célula. CellContentClick só dispara ao clicar no conteúdo (o texto).' },
    { t: 'Renomear o método para dtgAlunos_CellClick no código e pronto.', why: 'O designer continua ligado ao evento CellContentClick e passa a apontar para um método que não existe: erro de compilação.' },
    { t: 'Nada: CellContentClick e CellClick são a mesma coisa.', why: 'São eventos diferentes. Com CellContentClick, clicar no espaço vazio de uma célula não faz nada.' }],
  hints: ['Dois cliques criam o evento padrão do controle. O da grade não é o que o projeto usa.', 'Onde se escolhe qualquer evento de um controle?'] },
e10: { type: 'fill', title: 'Complete o Get e o Set',
  q: 'Complete as lacunas para o par Set/Get do nome e o tipo de retorno do GetSerie.',
  code: 'public void SetNome(string nome)\n{\n    this.⟦0⟧ = nome;\n}\n\npublic string GetNome()\n{\n    ⟦1⟧ this.nome;\n}\n\npublic ⟦2⟧ GetSerie()\n{\n    return this.serie;\n}',
  blanks: [['nome'], ['return'], ['int']],
  hints: ['this.??? é o atributo que recebe o parâmetro.', 'Que palavra devolve um valor? E qual é o tipo do atributo serie?'],
  explain: 'O Set guarda o parâmetro no atributo (this.nome = nome). O Get devolve com return. GetSerie devolve int porque o atributo serie é int.' },
e11: { type: 'mc', title: 'Preveja o resultado',
  q: 'O que aparece na MessageBox?',
  codeHtml: code('cs', 'Aluno objAluno = new Aluno();\nobjAluno.SetSerie(2);\nobjAluno.SetSerie(3);\nMessageBox.Show(objAluno.GetSerie().ToString());', 'pseudo', 'trecho de estudo, usa os métodos reais'),
  opts: [
    { t: '3', ok: true, why: 'O segundo Set substitui o valor do atributo. O atributo guarda um valor por vez.' },
    { t: '2', why: 'O 2 foi guardado primeiro, mas o SetSerie(3) escreveu por cima.' },
    { t: '23', why: 'serie é int, não uma lista nem um texto que vai juntando.' },
    { t: '0', why: '0 seria o valor de um objeto novo sem nenhum Set. Aqui houve dois.' }],
  hints: ['this.serie = serie; substitui ou acumula?'] },
e12: { type: 'mc', title: 'Por que void?',
  q: 'Por que <code>SetNome</code> é <code>public void</code> e <code>GetNome</code> é <code>public string</code>?',
  opts: [
    { t: 'SetNome só guarda um valor e não devolve nada; GetNome devolve o nome, que é string.', ok: true, why: 'O tipo antes do nome do método é o tipo do retorno. void quer dizer “sem retorno”.' },
    { t: 'void deixa o método privado.', why: 'Quem controla o acesso é public/private. void é sobre o retorno.' },
    { t: 'SetNome não pode receber parâmetros.', why: 'Recebe, sim: (string nome). void não impede parâmetros.' }],
  hints: ['Leia a palavra logo antes do nome do método.'] },
e13: { type: 'mc', title: 'Qual método da Conexao?',
  q: '<code>ListarAlunos()</code> precisa trazer os alunos para o DataGridView. Qual método da Conexao ele usa?',
  opts: [
    { t: 'ExecutarConsulta, que usa MySqlDataAdapter e Fill e devolve um DataTable', ok: true, why: 'SELECT traz linhas de volta. O Fill coloca essas linhas num DataTable.' },
    { t: 'ExecutarComando, que usa ExecuteNonQuery', why: 'ExecuteNonQuery não devolve tabela; devolve só a quantidade de linhas afetadas. E ExecutarComando é void.' },
    { t: 'Conectar, que já traz os dados', why: 'Conectar só abre a conexão. E é private: o Aluno nem consegue chamar.' }],
  hints: ['Qual dos dois métodos públicos tem DataTable como tipo de retorno?'] },
e14: { type: 'mc', title: 'Deu erro. A conexão fecha?',
  q: 'O MySQL recusou o SQL dentro de <code>ExecutarComando</code>. O <code>catch</code> faz <code>throw new Exception(...)</code>. A linha <code>conn.Close()</code> roda?',
  opts: [
    { t: 'Sim. O finally roda antes de o erro sair do método.', ok: true, why: 'É para isso que existe o finally: ele roda com sucesso, com return e com throw.' },
    { t: 'Não. O throw interrompe tudo e a conexão fica aberta.', why: 'Sem finally seria assim. Com finally, o C# executa o bloco antes de propagar a exceção.' },
    { t: 'Só se o usuário clicar OK na mensagem de erro.', why: 'O finally roda logo, dentro do método, antes de o erro chegar à tela.' }],
  hints: ['Releia o comentário que a professora deixou ao lado do finally.'] },
e15: { type: 'fill', title: 'String de conexão para outro banco',
  q: 'A prova pede o banco <code>DB_LojaCRUD</code> no MySQL do mesmo computador, usuário root sem senha. Complete.',
  code: 'string dadosConexao = "Persist security info = false; server = ⟦0⟧; database = ⟦1⟧; uid = ⟦2⟧; pwd=;";',
  blanks: [['localhost', '127.0.0.1'], ['DB_LojaCRUD', 'db_lojacrud'], ['root']],
  hints: ['O servidor está no mesmo computador.', 'O usuário é o mesmo do projeto da professora.'],
  explain: 'Só o database muda: server = localhost; database = DB_LojaCRUD; uid = root; pwd= vazio.' },
e16: { type: 'fill', title: 'Lendo os controles',
  q: 'Complete a leitura dos controles no início do btnCadastrar_Click.',
  code: 'string      nomeAluno = txtNome.⟦0⟧;\nDateTime    dtnascAluno = dtpNascimento.⟦1⟧;\nchar        turmaAluno = ⟦2⟧(cmbTurma.Text);\n\nif (rdbBarroca.⟦3⟧)\n    unidadeAluno = \'B\';',
  blanks: [['Text'], ['Value'], ['char.Parse'], ['Checked']],
  hints: ['TextBox → texto. DateTimePicker → valor de data.', 'O texto "A" precisa virar o caractere \'A\'. E o RadioButton responde se está marcado.'],
  explain: 'Text, Value, char.Parse e Checked: as quatro formas de leitura usadas no projeto. O C# diferencia maiúsculas, então “text” não serve.' },
e17: { type: 'code', title: 'Ternário para if/else',
  q: 'Reescreva a linha da série usando <code>if</code> / <code>else if</code> / <code>else</code>, com o mesmo resultado. Pode usar ou não chaves <code>{ }</code>.',
  codeHtml: snip('FrmAlunos.cs', 'serieAluno = rdb1Serie.Checked ?'),
  start: '',
  checks: [
    { re: /if\(rdb1Serie\.Checked\)\{?serieAluno=1;\}?/, msg: 'Falta o caso da 1ª série: if (rdb1Serie.Checked) serieAluno = 1;' },
    { re: /else if\(rdb2Serie\.Checked\)\{?serieAluno=2;\}?/, msg: 'Falta o else if da 2ª série com serieAluno = 2;' },
    { re: /else if\(rdb3Serie\.Checked\)\{?serieAluno=3;\}?/, msg: 'Falta o else if da 3ª série com serieAluno = 3;' },
    { re: /else ?\{?serieAluno=0;\}?$/, msg: 'Falta o else final com serieAluno = 0; (quando nada está marcado).' }],
  hints: ['Cada “? :” do ternário vira um if ou else if.', 'O último valor depois do último “:” vai no else.'],
  solution: 'if (rdb1Serie.Checked)\n    serieAluno = 1;\nelse if (rdb2Serie.Checked)\n    serieAluno = 2;\nelse if (rdb3Serie.Checked)\n    serieAluno = 3;\nelse\n    serieAluno = 0;' },
e18: { type: 'mc', title: 'Qual SQL sai daqui?',
  q: 'O usuário digitou <b>Ana Clara</b>, escolheu 15/03/2009, marcou <b>Floresta</b> e <b>2ª</b> e escolheu a turma <b>B</b>. Qual texto <code>InserirAluno()</code> monta?',
  opts: [
    { t: "INSERT INTO tblAlunos VALUES (null, 'Ana Clara','2009/03/15','F', '2', 'B');", ok: true, why: "Unidade vira 'F' pelo if/else, série vira 2 pelo ternário e a data sai no formato yyyy/MM/dd." },
    { t: "INSERT INTO tblAlunos VALUES (null, 'Ana Clara','15/03/2009','F', '2', 'B');", why: 'A data é formatada com ToString("yyyy/MM/dd"): ano primeiro.' },
    { t: "INSERT INTO tblAlunos VALUES (null, 'Ana Clara','2009/03/15','Floresta', '2ª', 'B');", why: "O código não usa o Text dos RadioButtons. Ele converte: Floresta → 'F' e 2ª → 2." },
    { t: "INSERT INTO tblAlunos VALUES (6, 'Ana Clara','2009/03/15','F', '2', 'B');", why: 'O id não é informado: vai null e o auto_increment escolhe.' }],
  hints: ['Olhe o if/else da unidade e o ternário da série.', 'E o formato da data dentro do ToString.'] },
e19: { type: 'mc', title: 'Linha 3, mas qual ID?',
  q: 'A grade está em ordem de nome: Ana Beatriz (id 1), Bruno (id 4), Carlos (id 2), Larissa (id 5), Mariana (id 3). O usuário clica em <b>Larissa</b>. Quanto vale <code>e.RowIndex</code> e o que vai para <code>txtID.Text</code>?',
  opts: [
    { t: 'e.RowIndex = 3 e txtID.Text = "5"', ok: true, why: 'Larissa é a 4ª linha (índice 3, começando do 0). O txtID recebe Cells["id"], o id do banco: 5.' },
    { t: 'e.RowIndex = 4 e txtID.Text = "4"', why: 'O índice começa em 0. E o txtID não recebe o índice: recebe a célula “id”.' },
    { t: 'e.RowIndex = 5 e txtID.Text = "5"', why: 'RowIndex é a posição na grade, não o id.' },
    { t: 'e.RowIndex = 3 e txtID.Text = "3"', why: 'O índice está certo, mas o txtID recebe Cells["id"].Value, que é 5.' }],
  hints: ['Conte as linhas começando do zero.', 'Que célula o código copia para o txtID?'] },
e20: { type: 'fill', title: 'Copiando a célula para o controle',
  q: 'Complete a linha do CellClick que copia o nome da linha clicada para o txtNome.',
  code: 'txtNome.Text    = dtgAlunos.Rows[⟦0⟧].Cells["⟦1⟧"].Value.⟦2⟧();',
  blanks: [['e.RowIndex'], ['nome'], ['ToString']],
  hints: ['O índice da linha clicada vem do parâmetro e.', 'O nome da coluna é o mesmo da tabela no banco. Value é object: precisa virar texto.'],
  explain: 'Rows[e.RowIndex] pega a linha clicada; Cells["nome"] pega a coluna pelo nome; Value.ToString() transforma em string para o Text.' },
e21: { type: 'mc', title: 'A grade já abre cheia',
  q: 'Ao abrir o FrmAlunos, a grade já aparece com os alunos, sem clicar em nada. Por quê?',
  opts: [
    { t: 'O evento Load do formulário chama MostrarDadosAlunos().', ok: true, why: 'FrmAlunos_Load roda quando a janela abre, e o Designer ligou esse método ao evento Load.' },
    { t: 'O DataGridView lê o MySQL sozinho.', why: 'Sem receber um DataSource, a grade fica vazia.' },
    { t: 'O construtor FrmAlunos() faz o SELECT.', why: 'O construtor só chama InitializeComponent(), que cria os controles.' }],
  hints: ['Qual evento dispara quando a janela abre?'] },
e22: { type: 'mc', title: 'Esqueceram o WHERE',
  q: 'O que acontece se o UPDATE for <code>UPDATE tblalunos SET turma = \'C\';</code>, sem WHERE?',
  opts: [
    { t: 'Todos os alunos da tabela passam para a turma C.', ok: true, why: 'Sem filtro, o UPDATE vale para todas as linhas. Por isso Alterar sempre leva WHERE id = ...' },
    { t: 'Só o aluno selecionado na grade muda.', why: 'O banco não sabe o que está selecionado na tela. Só o WHERE diz qual linha.' },
    { t: 'O MySQL recusa e dá erro.', why: 'É um comando válido. O MySQL executa sem perguntar.' },
    { t: 'Nada muda, porque falta o id.', why: 'Sem o WHERE, o comando atinge todas as linhas, não nenhuma.' }],
  hints: ['O WHERE é um filtro. Sem filtro, quantas linhas sobram?'] },
e23: { type: 'code', title: 'Conserte o ExcluirAluno',
  q: 'Este método apaga <b>todos</b> os alunos. Corrija para apagar só o aluno do id guardado no objeto.',
  start: 'public void ExcluirAluno()\n{\n    string deletar = $"DELETE FROM tblalunos;";\n    db.ExecutarComando(deletar);\n}',
  checks: [
    { re: /\$"DELETE FROM tblalunos WHERE id='?\{(this\.)?id\}'?;?"/i, msg: 'O DELETE precisa de WHERE id = \'{this.id}\' dentro da string interpolada.' },
    { re: /db\.ExecutarComando\(deletar\);/, msg: 'Não apague a linha db.ExecutarComando(deletar);' }],
  hints: ['O id já está no atributo do objeto (foi guardado com setId).', 'Dentro do $"...", use {this.id} entre apóstrofos, como no original.'],
  solution: 'public void ExcluirAluno()\n{\n    string deletar = $"DELETE FROM tblalunos WHERE id = \'{this.id}\';";\n    db.ExecutarComando(deletar);\n}' },
e24: { type: 'mc', title: 'Por que não alterou?',
  q: 'Você selecionou a aluna de id 7 e começou a editar. Enquanto isso, um colega excluiu esse registro em outro computador. Você clica em Alterar e aparece “Dados do aluno ALTERADOS com sucesso.”, mas nada mudou. Por quê?',
  opts: [
    { t: 'O UPDATE rodou com WHERE id = \'7\', não achou nenhuma linha e afetou 0 registros. O original não confere essa quantidade e mostra a mensagem mesmo assim.', ok: true, why: 'ExecuteNonQuery devolveria 0, mas o valor é ignorado. A MessageBox está no formulário e roda sempre que não há exceção.' },
    { t: 'O MySQL deu erro, mas a mensagem escondeu.', why: 'Atualizar 0 linhas não é erro para o MySQL. Se fosse erro, a exceção apareceria e a MessageBox nem rodaria.' },
    { t: 'Faltou chamar LimparDados() antes do UPDATE.', why: 'LimparDados só mexe na tela. O problema está no registro que o WHERE procura.' }],
  hints: ['O registro 7 ainda existe no banco?', 'O que ExecuteNonQuery retorna e o que o projeto faz com esse retorno?'] },
e25: { type: 'mc', title: 'Limpar apaga?',
  q: 'Depois de clicar em <b>Limpar</b>, o que muda no banco de dados?',
  opts: [
    { t: 'Nada. LimparDados() só esvazia os controles da tela.', ok: true, why: 'Não há SQL nenhum em LimparDados: só Clear(), Checked = false e SelectedIndex = -1.' },
    { t: 'O registro selecionado é excluído.', why: 'Quem exclui é o btnExcluir_Click, com DELETE e WHERE.' },
    { t: 'O banco inteiro é limpo.', why: 'Para isso seria preciso um DELETE sem WHERE. LimparDados não executa SQL.' }],
  hints: ['Procure “ExecutarComando” dentro de LimparDados.'] },
e29: { type: 'order', title: 'A ordem do Excluir',
  q: 'Coloque os passos do <code>btnExcluir_Click</code> na ordem em que aparecem no original.',
  items: ['int idAluno = int.Parse(txtID.Text);', 'objAluno.setId(idAluno);', 'objAluno.ExcluirAluno();', 'MessageBox.Show("Dados do aluno excluídos com sucesso.");', 'LimparDados();', 'MostrarDadosAlunos();'],
  hints: ['Primeiro o ID sai da tela, depois entra no objeto.', 'No Excluir, a grade é recarregada por último (no Alterar é antes da mensagem).'],
  explain: 'Ler o ID → guardar no objeto → executar o DELETE → avisar → limpar a tela → recarregar a grade.' },
e26: { type: 'match', title: 'Tipo SQL para tipo C#',
  q: 'Escolha o tipo C# do atributo para cada tipo de coluna.',
  pairs: [['varchar(50)', 'string'], ['int', 'int'], ['date', 'DateTime'], ['char(1)', 'char'], ['decimal(10,2)', 'decimal'], ['tinyint(1) / boolean', 'bool']],
  hints: ['O projeto já mostra quatro destes: nome, serie, dtnasc e turma.', 'Para dinheiro, o C# tem um tipo decimal; para sim/não, bool.'],
  explain: 'varchar → string; int → int; date → DateTime; char(1) → char; decimal → decimal; tinyint(1) → bool.' },
e27: { type: 'match', title: 'Coluna para controle',
  q: 'Tabela de produtos. Escolha o controle mais adequado para cada coluna.',
  pairs: [['descricao varchar(60)', 'TextBox'], ['dtvalidade date', 'DateTimePicker'], ['categoria char(1): Alimento, Limpeza ou Higiene', 'RadioButtons dentro de um GroupBox'], ['setor char(1) com 8 opções', 'ComboBox'], ['ativo tinyint(1) (sim/não)', 'CheckBox'], ['id auto_increment', 'TextBox desabilitado']],
  hints: ['Poucas opções fixas e visíveis: RadioButton. Muitas opções: ComboBox.', 'O id não é digitado pelo usuário, só exibido.'],
  explain: 'Texto livre → TextBox; data → DateTimePicker; poucas opções → RadioButtons agrupados; muitas opções → ComboBox; sim/não → CheckBox; id → TextBox com Enabled = false.' },
e30: { type: 'order', title: 'Por onde começar na prova',
  q: 'Ordene as etapas de adaptação para uma tabela nova.',
  items: ['Ler a tabela e identificar colunas, tipos e a chave primária', 'Criar a classe da entidade com atributos privados', 'Criar um Set e um Get para cada atributo', 'Escrever Inserir, Alterar, Excluir e Listar com o nome da tabela nova', 'Ajustar o database na string da Conexao', 'Montar o formulário: controles, Name e eventos Click, Load e CellClick'],
  hints: ['Primeiro entender os dados, depois escrever a classe.', 'O formulário usa a classe pronta, então vem por último.'],
  explain: 'Dados → classe → Get/Set → SQL → conexão → tela. Assim cada etapa usa o que a anterior criou.' },
e28: { type: 'open', title: 'Escreva para outro tema',
  q: 'A tabela <code>tblProdutos</code> tem a coluna <code>estoque int</code>. Escreva o atributo, o <code>SetEstoque</code>, o <code>GetEstoque</code> e a linha do formulário que lê <code>txtEstoque</code> e guarda no objeto <code>objProduto</code>.',
  placeholder: '// atributo\n\n// Set e Get\n\n// no btnCadastrar_Click',
  solution: code('cs', `
// Em Produto.cs: o atributo, junto com os outros
private int estoque;

// Set: recebe o valor e guarda no atributo
public void SetEstoque(int estoque)
{
    this.estoque = estoque;
}

// Get: devolve o valor guardado
public int GetEstoque()
{
    return this.estoque;
}

// Em FrmProdutos.cs, dentro do btnCadastrar_Click:
int estoqueProduto = int.Parse(txtEstoque.Text);  // TextBox devolve texto: converter para int
objProduto.SetEstoque(estoqueProduto);`, 'adaptado', 'solução comentada'),
  criteria: ['O atributo é private e do tipo int', 'SetEstoque é public void e recebe (int estoque)', 'SetEstoque usa this.estoque = estoque;', 'GetEstoque é public int e usa return', 'A leitura converte com int.Parse(txtEstoque.Text)', 'O valor vai para o objeto com objProduto.SetEstoque(...)'],
  hints: ['Copie o padrão de SetSerie/GetSerie trocando serie por estoque.', 'TextBox sempre devolve string: int.Parse.'] }
};

/* ------------------------------------------------------------
   DESAFIOS DE ERROS COMUNS (também contam como exercícios)
   ------------------------------------------------------------ */
const ERRORS = [
{ id: 'r1', title: 'int.Parse com o campo vazio',
  ctx: `<p>Você abre o formulário e clica em <b>Excluir</b> sem selecionar ninguém. O <code>txtID</code> está vazio.</p>${snip('FrmAlunos.cs', 'int idAluno = int.Parse(txtID.Text); //O ID')}`,
  ex: { type: 'mc', q: 'O que acontece?', opts: [
    { t: 'int.Parse("") lança FormatException e o método para ali. Nada é excluído.', ok: true, why: 'Texto vazio não é um número. Como não há try/catch no botão, a exceção não é tratada.' },
    { t: 'Exclui o aluno de id 0.', why: 'Nem chega no DELETE: a conversão falha antes.' },
    { t: 'Exclui todos os alunos.', why: 'O DELETE nem é montado. E ele teria WHERE.' }], hints: ['int.Parse precisa de dígitos.'] },
  fix: code('cs', `
// Melhoria: conferir antes de converter
if (txtID.Text == "")
{
    MessageBox.Show("Selecione um aluno na tabela primeiro.");
    return;   // sai do método sem executar o resto
}
int idAluno = int.Parse(txtID.Text);`, 'melhoria') },
{ id: 'r2', title: 'char.Parse sem turma selecionada',
  ctx: `<p>O usuário preenche tudo, esquece a turma e clica em <b>Cadastrar</b>. Depois de <code>LimparDados()</code>, <code>cmbTurma.SelectedIndex</code> é -1 e <code>cmbTurma.Text</code> é <code>""</code>.</p>${snip('FrmAlunos.cs', 'turmaAluno = char.Parse(cmbTurma.Text);')}`,
  ex: { type: 'mc', q: 'O que acontece?', opts: [
    { t: 'char.Parse("") lança FormatException e nada é gravado.', ok: true, why: 'char.Parse exige exatamente 1 caractere. Como a linha está entre as declarações, o erro acontece antes até da unidade e da série.' },
    { t: 'Grava a turma como espaço em branco.', why: 'Isso acontece com a unidade (o else grava \' \'). A turma usa char.Parse, que falha.' },
    { t: 'Grava a turma A, a primeira da lista.', why: 'Com SelectedIndex -1, nenhum item está escolhido. O Text é vazio.' }], hints: ['Quantos caracteres tem ""?'] },
  fix: code('cs', `
// Melhoria: exigir a turma
if (cmbTurma.SelectedIndex == -1)
{
    MessageBox.Show("Escolha a turma.");
    return;
}`, 'melhoria') },
{ id: 'r3', title: 'CellClick no cabeçalho',
  ctx: `<p>O usuário clica no título de uma coluna (por exemplo, “nome”). O CellClick também dispara para o cabeçalho, com <code>e.RowIndex</code> igual a <b>-1</b>.</p>${snip('FrmAlunos.cs', 'txtID.Text      = dtgAlunos.Rows[e.RowIndex]')}`,
  ex: { type: 'mc', q: 'O que acontece com o código original?', opts: [
    { t: 'Rows[-1] não existe: ArgumentOutOfRangeException.', ok: true, why: 'Os índices de linha começam em 0. -1 indica o cabeçalho e não é uma linha de dados.' },
    { t: 'Seleciona a primeira linha.', why: 'Não há nenhuma regra que transforme -1 em 0.' },
    { t: 'Nada: o cabeçalho não dispara CellClick.', why: 'Dispara, sim, com RowIndex -1.' }], hints: ['Existe linha de número -1?'] },
  fix: code('cs', `
// Melhoria: primeira linha do dtgAlunos_CellClick
if (e.RowIndex < 0) return;   // clicou no cabeçalho`, 'melhoria') },
{ id: 'r4', title: 'Linha nova ou sem valores',
  ctx: '<p>Por padrão o DataGridView mostra uma linha vazia no fim, marcada com *, para digitar um registro novo (<code>AllowUserToAddRows</code> = true). O usuário clica nela.</p>',
  ex: { type: 'mc', q: 'O que acontece em <code>Cells["id"].Value.ToString()</code>?', opts: [
    { t: 'Value vem vazio (null) e .ToString() lança NullReferenceException.', ok: true, why: 'A linha nova ainda não tem dados. Chamar um método sobre null gera NullReferenceException.' },
    { t: 'Vem "0" e o txtID mostra 0.', why: 'A linha nova não tem valor nenhum, nem 0.' },
    { t: 'Cria um aluno novo no banco.', why: 'O CellClick só copia valores para a tela. Nenhum SQL é executado.' }], hints: ['Qual é o valor de uma célula que nunca recebeu dado?'] },
  fix: code('cs', `
// Melhoria: ignorar cabeçalho e linha nova
if (e.RowIndex < 0 || dtgAlunos.Rows[e.RowIndex].IsNewRow) return;

// ou, no Designer: dtgAlunos -> AllowUserToAddRows = False`, 'melhoria') },
{ id: 'r5', title: 'Alterar ou excluir sem um ID válido',
  ctx: '<p>Dois casos: (a) clicar em Alterar sem ter selecionado uma linha; (b) o ID no <code>txtID</code> é de um registro que já foi excluído.</p>',
  ex: { type: 'mc', q: 'Qual frase descreve os dois casos no código original?', opts: [
    { t: '(a) dá FormatException no int.Parse; (b) roda o UPDATE, afeta 0 linhas e ainda mostra “ALTERADOS com sucesso”.', ok: true, why: 'O original não confere o retorno de ExecuteNonQuery, então não sabe que nada mudou.' },
    { t: 'Os dois mostram erro do MySQL.', why: 'O caso (a) falha no C# antes de chegar ao MySQL. O (b) não é erro para o MySQL.' },
    { t: 'Os dois cadastram um aluno novo.', why: 'Alterar monta UPDATE, nunca INSERT.' }], hints: ['Separe o que falha no C# do que vai até o banco.'] },
  fix: code('cs', `
// Melhoria em Conexao.cs: devolver as linhas afetadas
public int ExecutarComando(string sql)
{
    Conectar();
    try
    {
        MySqlCommand comando = new MySqlCommand(sql, conn);
        return comando.ExecuteNonQuery();   // quantidade de linhas afetadas
    }
    catch (MySqlException ex)
    {
        throw new Exception($"Instrução não executada.\\n{sql}\\n{ex.Message}");
    }
    finally
    {
        conn.Close();
    }
}
// Os métodos do Aluno passariam a devolver esse int,
// e o formulário mostraria "Nenhum registro encontrado" quando for 0.`, 'melhoria') },
{ id: 'r6', title: 'Nome do controle diferente do código',
  ctx: '<p>Você arrastou um TextBox e esqueceu de mudar o Name. Ele ficou <code>textBox1</code>, mas o código usa <code>txtNome.Text</code>.</p>',
  ex: { type: 'mc', q: 'Quando aparece o problema?', opts: [
    { t: 'Ao compilar: o nome txtNome não existe no contexto atual.', ok: true, why: 'O compilador procura um campo chamado txtNome na classe e não acha. O programa nem abre.' },
    { t: 'Só ao clicar em Cadastrar.', why: 'Nome inexistente é erro de compilação, não de execução.' },
    { t: 'Nunca: o C# acha o controle pelo Text.', why: 'O código encontra controles pelo Name.' }], hints: ['Isso é erro de digitação no código ou de dado na tela?'] },
  fix: '<p><b>Correção:</b> selecione o TextBox no Designer e mude a propriedade <b>(Name)</b> para <code>txtNome</code>. Faça isso antes de criar eventos, para os métodos já nascerem com o nome certo.</p>' },
{ id: 'r7', title: 'Evento não associado',
  ctx: '<p>Você copiou o método <code>btnAlterar_Click</code> de um colega e colou no seu <code>FrmAlunos.cs</code>. O projeto compila, mas clicar em Alterar não faz nada.</p>',
  ex: { type: 'mc', q: 'Qual é a causa mais provável?', opts: [
    { t: 'O Click do botão não está ligado ao método: falta a linha += no designer.', ok: true, why: 'Ter o método não basta. Quem liga o evento ao método é o designer, quando você escolhe o método no ⚡ Eventos.' },
    { t: 'O MySQL está desligado.', why: 'Com o MySQL desligado haveria uma exceção. Aqui não acontece nada.' },
    { t: 'O método precisa ser public.', why: 'Os métodos de evento do projeto são private e funcionam.' }], hints: ['O que liga um clique a um método?'] },
  fix: '<p><b>Correção:</b> selecione o botão → Propriedades → ⚡ → no evento <b>Click</b>, escolha <code>btnAlterar_Click</code> na lista. O caso oposto também acontece: apagar o método do <code>.cs</code> e deixar a linha <code>+=</code> no designer gera erro de compilação, porque o designer aponta para um método que não existe.</p>' },
{ id: 'r8', title: 'Grade desatualizada',
  ctx: '<p>Alguém apagou a chamada <code>MostrarDadosAlunos();</code> do <code>btnAlterar_Click</code>. Você altera a turma da Mariana para C.</p>',
  ex: { type: 'mc', q: 'O que você vê?', opts: [
    { t: 'O banco já tem turma C, mas a grade continua mostrando a turma antiga até a próxima recarga.', ok: true, why: 'A grade é uma cópia. Sem SELECT novo, a cópia não muda.' },
    { t: 'O UPDATE não é executado.', why: 'O UPDATE roda em AlterarAluno(). MostrarDadosAlunos só recarrega a tela.' },
    { t: 'Dá erro de compilação.', why: 'Tirar uma chamada de método não quebra a compilação.' }], hints: ['Quem faz o SELECT depois das alterações?'] },
  fix: '<p><b>Correção:</b> chamar <code>MostrarDadosAlunos();</code> depois de cada InserirAluno, AlterarAluno e ExcluirAluno, como no original.</p>' },
{ id: 'r9', title: 'Banco, servidor ou credenciais errados',
  ctx: `<p>Na prova, o MySQL do laboratório tem senha, ou o banco ainda não foi criado.</p>${snip('Conexao.cs', 'string dadosConexao =')}`,
  ex: { type: 'mc', q: 'O banco <code>DB_EscolaCRUD</code> não foi criado (o script não rodou). O que acontece ao abrir o FrmAlunos?', opts: [
    { t: 'No Load, conn.Open() falha e aparece a exceção “A conexão não foi estabelecida.” com a mensagem do MySQL (Unknown database).', ok: true, why: 'O Load chama MostrarDadosAlunos → ListarAlunos → ExecutarConsulta → Conectar. Open() falha e o catch lança a Exception com o texto da professora.' },
    { t: 'O C# cria o banco automaticamente.', why: 'Quem cria é o script SQL, rodado no MySQL.' },
    { t: 'A grade aparece vazia, sem erro.', why: 'Sem conexão não há DataTable nenhum: o erro sobe até a tela.' }], hints: ['Qual é o primeiro SQL executado quando o formulário abre?'] },
  fix: '<p><b>Checklist de conexão:</b> o MySQL está rodando (XAMPP/serviço iniciado)? O script foi executado? <code>database</code> tem o mesmo nome do <code>create database</code>? <code>uid</code> e <code>pwd</code> são os do laboratório? Mensagens típicas do MySQL: “Unable to connect to any of the specified MySQL hosts” (servidor desligado ou endereço errado), “Unknown database” (banco não existe), “Access denied for user” (usuário ou senha).</p>' },
{ id: 'r10', title: 'UPDATE ou DELETE sem WHERE',
  ctx: code('cs', 'string alterar = $"UPDATE tblalunos SET nome = \'{nome}\', dtnasc = \'{dtnasc.ToString("yyyy/MM/dd")}\', unidade = \'{unidade}\', serie = \'{serie}\', turma = \'{turma}\';";', 'erro', 'o WHERE foi apagado'),
  ex: { type: 'mc', q: 'Você altera a Ana e clica em Alterar. O que acontece?', opts: [
    { t: 'Todos os alunos ficam com o nome, data, unidade, série e turma da Ana.', ok: true, why: 'Sem WHERE, o SET vale para todas as linhas. Os IDs continuam diferentes, mas o resto fica igual.' },
    { t: 'Só a Ana é alterada, porque o objeto tem o id dela.', why: 'O id está no objeto, mas não está no SQL. O MySQL só sabe o que está no texto do comando.' },
    { t: 'Erro de sintaxe.', why: 'UPDATE sem WHERE é SQL válido.' }], hints: ['O objeto sabe o id. E o texto do SQL?'] },
  fix: '<p><b>Correção:</b> terminar sempre com <code>where id = \'{this.id}\'</code>. Uma boa prática na prova é escrever o WHERE <em>primeiro</em> e depois o SET.</p>' },
{ id: 'r11', title: 'tblAlunos ou tblalunos?',
  ctx: '<p>No original, o INSERT e o SELECT usam <code>tblAlunos</code>, e o UPDATE e o DELETE usam <code>tblalunos</code>. No laboratório (Windows) tudo funciona.</p>',
  ex: { type: 'mc', q: 'O mesmo programa, apontando para um MySQL instalado em Linux com a configuração padrão, falharia por quê?', opts: [
    { t: 'No Linux, por padrão, nomes de tabela diferenciam maiúsculas: tblalunos e tblAlunos são tabelas diferentes, e uma delas “não existe”.', ok: true, why: 'Os nomes de tabela viram arquivos, e no Windows o MySQL usa lower_case_table_names = 1 (ignora maiúsculas). No Linux o padrão é 0.' },
    { t: 'O Linux não aceita auto_increment.', why: 'auto_increment funciona em qualquer sistema.' },
    { t: 'O C# não roda em Linux.', why: 'O C# está no Windows. Quem está no Linux, nesse cenário, é só o servidor MySQL.' }], hints: ['Compare os nomes da tabela nos quatro métodos do Aluno.cs.'] },
  fix: '<p><b>Correção:</b> escolha uma grafia e use a mesma em todos os comandos. Os nomes de <em>colunas</em> não têm esse problema no MySQL.</p>' }
];

/* ------------------------------------------------------------
   ANOTAÇÕES DO EXPLORADOR DE CÓDIGO
   m: trecho que identifica a linha; n: quantas linhas; o: ocorrência
   ------------------------------------------------------------ */
const ANN = {
'Script_DBEscola.sql': [
  { m: 'create database DB_EscolaCRUD;', what: 'Cria o banco de dados.', why: 'Um banco é um “armário” que guarda tabelas. Precisa existir antes da tabela.', next: 'O nome DB_EscolaCRUD é o mesmo que aparece em database = na string de conexão.', adapt: 'Troque pelo banco do enunciado, por exemplo DB_LojaCRUD.', simple: 'Crie um armário chamado DB_EscolaCRUD.' },
  { m: 'use DB_EscolaCRUD;', what: 'Seleciona o banco em que os próximos comandos vão rodar.', why: 'Sem isso, o create table iria para o banco que estivesse selecionado antes.', simple: 'A partir de agora, trabalhe dentro desse armário.' },
  { m: 'create table tblAlunos(', n: 8, what: 'Cria a tabela e define as colunas.', why: 'Cada linha entre os parênteses é uma coluna: nome, tipo e regras (not null...).', next: 'A classe Aluno terá um atributo para cada coluna daqui.', adapt: 'Na prova, essa parte vem pronta. Seu trabalho é ler cada coluna e decidir tipo C# e controle.', simple: 'Crie uma tabela chamada tblAlunos com estas colunas.' },
  { m: 'id int not null primary key auto_increment', what: 'Chave primária numérica gerada pelo MySQL.', why: 'Identifica cada aluno sem repetir. Alterar e excluir dependem dela.', next: 'Por isso o INSERT manda null no id, e o UPDATE/DELETE usam WHERE id = ...', adapt: 'Quase toda tabela de prova tem uma coluna assim. Trate igual.', simple: 'Cada aluno ganha um número único, escolhido pelo banco.' },
  { m: 'nome varchar(50) not null', what: 'Texto de até 50 caracteres, obrigatório.', from: 'Vem do txtNome.Text.', adapt: 'varchar → string no C# e TextBox na tela.', simple: 'Um texto de até 50 letras.' },
  { m: 'dtnasc date not null', what: 'Data sem horário.', from: 'Vem do dtpNascimento.Value.', adapt: 'date → DateTime e DateTimePicker.', simple: 'Uma data.' },
  { m: 'unidade char(1) not null', what: 'Exatamente um caractere: B (Barroca) ou F (Floresta).', from: 'Decidido pelos RadioButtons rdbBarroca/rdbFloresta.', adapt: 'char(1) com poucas opções → RadioButtons num GroupBox.', simple: 'Uma letra só.' },
  { m: 'serie int not null', what: 'Número inteiro: 1, 2 ou 3.', from: 'Decidido pelos RadioButtons de série, com o operador ternário.', simple: 'Um número inteiro.' },
  { m: 'turma char(1) not null', what: 'Uma letra de A a E.', from: 'Vem do cmbTurma.Text, convertido com char.Parse.', adapt: 'char(1) com várias opções → ComboBox.', simple: 'Outra letra só.' },
  { m: 'select * from tblalunos;', what: 'Consulta de teste: mostra tudo o que há na tabela.', why: 'Serve para conferir no MySQL se os cadastros do programa chegaram.', simple: 'Mostre tudo o que tem na tabela.' }],
'Program.cs': [
  { m: '[STAThread]', what: 'Atributo exigido pelo Windows Forms na thread principal.', why: 'Controles do Windows (como caixas de diálogo) precisam desse modo de thread.', adapt: 'Não mexa. Vem pronto em todo projeto Windows Forms.', simple: 'Configuração técnica que o Windows Forms precisa.' },
  { m: 'static void Main()', what: 'Ponto de entrada: é o primeiro método que roda.', simple: 'O programa começa aqui.' },
  { m: 'Application.EnableVisualStyles();', what: 'Liga o visual moderno dos controles.', simple: 'Use o visual atual do Windows.' },
  { m: 'Application.Run(new FrmPrincipal());', what: 'Cria o FrmPrincipal e mantém o programa rodando enquanto ele estiver aberto.', next: 'Quando o FrmPrincipal fecha, o programa termina.', adapt: 'Se o seu projeto não tiver menu, aqui pode ir direto new FrmProdutos().', simple: 'Abra a janela principal e espere até ela fechar.' }],
'FrmPrincipal.cs': [
  { m: 'public partial class FrmPrincipal : Form', what: 'Declara a janela principal. “: Form” quer dizer que ela é um formulário do Windows Forms.', why: 'partial: a outra metade da classe está no FrmPrincipal.Designer.cs.', simple: 'Esta é a janela do menu.' },
  { m: 'InitializeComponent();', what: 'Cria os controles desenhados no Designer (o menu).', simple: 'Monte a janela como foi desenhada.' },
  { m: 'private void aLUNOSToolStripMenuItem_Click', what: 'Evento de clique no item ALUNOS do menu.', why: 'O nome estranho (aLUNOS...) foi gerado automaticamente a partir do texto do item.', simple: 'Quando clicarem em ALUNOS...' },
  { m: 'FrmAlunos telaAlunos = new FrmAlunos();', what: 'Cria um objeto da janela de alunos.', next: 'Cada vez que o menu é clicado, nasce um FrmAlunos novo, com um objAluno novo.', adapt: 'FrmProdutos telaProdutos = new FrmProdutos();', simple: 'Prepare uma janela de alunos nova.' },
  { m: 'telaAlunos.ShowDialog();', what: 'Mostra a janela como modal.', why: 'Modal: o menu fica bloqueado até a janela de alunos fechar.', next: 'Ao aparecer, o FrmAlunos dispara o evento Load.', simple: 'Mostre essa janela e espere o usuário fechar.' },
  { m: 'this.Close();', what: 'Fecha a janela principal, e com ela o programa.', simple: 'Feche o programa.' }],
'Aluno.cs': [
  { m: 'using System.Data;', what: 'Libera o uso de DataTable sem escrever System.Data.DataTable.', simple: 'Vou usar tabelas em memória (DataTable).' },
  { m: 'internal class Aluno', what: 'Declara a classe Aluno, o molde de um aluno.', why: 'internal: visível só dentro deste projeto.', adapt: 'internal class Produto', simple: 'Este é o molde de um aluno.' },
  { m: 'private int id, serie;', what: 'Dois atributos inteiros, declarados na mesma linha.', why: 'São int porque as colunas id e serie são int. private: só a classe acessa.', adapt: 'Um atributo para cada coluna da tabela nova, com o tipo C# correspondente.', simple: 'Todo aluno tem um id e uma série, ambos números.' },
  { m: 'private string nome;', what: 'Atributo de texto para a coluna nome (varchar).', simple: 'Todo aluno tem um nome (texto).' },
  { m: 'private char turma, unidade;', what: 'Atributos de um caractere para as colunas char(1).', simple: 'Turma e unidade são uma letra cada.' },
  { m: 'private DateTime dtnasc;', what: 'Atributo de data para a coluna date.', simple: 'Todo aluno tem uma data de nascimento.' },
  { m: 'public void setId(int id)', n: 4, what: 'Set do id: recebe um número e guarda no atributo.', why: 'Usado por Alterar e Excluir, que precisam saber qual registro.', from: 'O valor vem de int.Parse(txtID.Text) no formulário.', next: 'O atributo id é usado no WHERE id = \'{this.id}\'.', adapt: 'Repare: este começa com s minúsculo. No formulário, chame exatamente setId.', simple: 'Receba um id e guarde neste aluno.' },
  { m: 'public int GetId()', n: 4, what: 'Get do id: devolve o valor guardado.', why: 'O projeto não chama GetId, mas o par Get/Set completa o encapsulamento.', simple: 'Diga qual é o id deste aluno.' },
  { m: 'public void SetSerie(int serie)', n: 4, what: 'Guarda a série.', from: 'Do ternário com os RadioButtons de série.', simple: 'Receba a série e guarde.' },
  { m: 'public void SetDtNasc(DateTime dtnasc)', n: 4, what: 'Guarda a data de nascimento.', from: 'De dtpNascimento.Value.', simple: 'Receba a data e guarde.' },
  { m: 'public void SetNome(string nome)', n: 4, what: 'Guarda o nome.', why: 'this.nome é o atributo; nome sozinho é o parâmetro.', from: 'De txtNome.Text.', adapt: 'Padrão para toda coluna: public void SetX(tipo x) { this.x = x; }', simple: 'Pegue o nome que chegou e guarde no nome deste aluno.' },
  { m: 'public string GetNome()', n: 4, what: 'Devolve o nome guardado.', simple: 'Diga qual é o nome deste aluno.' },
  { m: 'public void SetUnidade(char unidade)', n: 4, what: 'Guarda a unidade (B ou F).', simple: 'Receba a letra da unidade e guarde.' },
  { m: 'public void SetTurma(char turma)', n: 4, what: 'Guarda a turma.', simple: 'Receba a letra da turma e guarde.' },
  { m: 'Conexao db = new Conexao();', what: 'Cria o objeto de conexão que os métodos do CRUD usam.', why: 'O Aluno monta o SQL, mas quem executa é a Conexao.', next: 'db.ExecutarComando(...) e db.ExecutarConsulta(...).', simple: 'Tenha à mão alguém que fala com o banco.' },
  { m: 'public void InserirAluno()', what: 'Método do C (Create).', why: 'Não recebe parâmetros: usa os atributos já preenchidos pelos Set.', adapt: 'InserirProduto(), InserirTime()...', simple: 'Cadastre este aluno no banco.' },
  { m: 'string inserir = $"INSERT', what: 'Monta o texto do INSERT trocando {nome}, {dtnasc...} etc. pelos valores dos atributos.', why: 'null no lugar do id porque ele é auto_increment. A data vira yyyy/MM/dd, que o MySQL entende.', from: 'Dos atributos, preenchidos pelos Set no btnCadastrar_Click.', next: 'O texto vai para db.ExecutarComando.', adapt: 'A ordem dos valores precisa ser a ordem das colunas no create table. Valores com apóstrofo (D\'Ávila) quebram esse SQL: veja Erros comuns.', simple: 'Escreva um pedido de cadastro com os dados deste aluno.' },
  { m: 'db.ExecutarComando(inserir);', what: 'Manda o INSERT para a Conexao executar.', simple: 'Entregue o pedido para quem fala com o banco.' },
  { m: 'public void AlterarAluno()', what: 'Método do U (Update).', simple: 'Atualize este aluno no banco.' },
  { m: 'string alterar = $"UPDATE', what: 'Monta o UPDATE com SET coluna = valor para cada coluna e WHERE id.', why: 'O WHERE id = \'{this.id}\' garante que só o aluno escolhido muda.', from: 'O id veio do txtID via setId.', adapt: 'Repare em tblalunos minúsculo aqui (e tblAlunos no INSERT). Veja Erros comuns.', simple: 'Escreva: troque os dados do aluno que tem este id.' },
  { m: 'public void ExcluirAluno()', what: 'Método do D (Delete).', simple: 'Exclua este aluno do banco.' },
  { m: 'string deletar = $"DELETE', what: 'Monta o DELETE com WHERE id.', why: 'Sem o WHERE, apagaria todos.', simple: 'Escreva: apague o aluno que tem este id.' },
  { m: 'public DataTable ListarAlunos()', what: 'Método do R (Read). Devolve um DataTable.', next: 'MostrarDadosAlunos coloca o retorno no dtgAlunos.DataSource.', adapt: 'public DataTable ListarProdutos()', simple: 'Traga a lista de alunos.' },
  { m: 'string consulta = "SELECT', what: 'SELECT de todas as colunas, em ordem de nome.', why: 'Não precisa de $ porque não tem nenhum valor variável.', adapt: 'ORDER BY pela coluna que fizer sentido (descricao, titulo...).', simple: 'Peça todos os alunos em ordem alfabética.' },
  { m: 'return db.ExecutarConsulta(consulta);', what: 'Executa o SELECT e devolve o DataTable recebido da Conexao.', simple: 'Devolva o que o banco respondeu.' }],
'Conexao.cs': [
  { m: 'using MySql.Data.MySqlClient;', what: 'Libera as classes do MySQL (MySqlConnection, MySqlCommand...).', why: 'Elas vêm do pacote NuGet MySql.Data instalado no projeto.', simple: 'Vou usar as ferramentas do MySQL.' },
  { m: 'MySqlConnection conn;', what: 'Declara o campo da conexão, ainda sem valor.', next: 'Conectar() cria o objeto e abre.', simple: 'Reserve um lugar para a conexão.' },
  { m: 'private void Conectar()', what: 'Abre a conexão. É private: só a própria Conexao chama.', simple: 'Ligue para o banco.' },
  { m: 'string dadosConexao =', what: 'String de conexão: servidor, banco, usuário e senha.', why: 'server = localhost: o MySQL está neste computador. uid = root e pwd vazio: padrão do XAMPP.', adapt: 'Na prova, troque database = pelo banco novo. Se o laboratório tiver senha, preencha pwd.', simple: 'Endereço e senha do banco.' },
  { m: 'conn = new MySqlConnection(dadosConexao);', what: 'Cria o objeto de conexão com essas informações.', simple: 'Prepare a ligação com esse endereço.' },
  { m: 'conn.Open();', what: 'Abre a conexão de fato.', why: 'Se o servidor estiver desligado, ou banco, usuário ou senha estiverem errados, falha aqui.', simple: 'Conecte agora.' },
  { m: 'catch(MySqlException ex)', what: 'Captura erros do MySQL na abertura.', simple: 'Se o banco não atender...' },
  { m: 'throw new Exception($"A conexão', what: 'Lança um erro novo com uma mensagem clara e a mensagem original do MySQL.', next: 'O erro sobe para quem chamou (ExecutarComando/ExecutarConsulta) e, como ninguém trata, até a tela.', simple: 'Avise que não conectou e diga o motivo.' },
  { m: 'public void ExecutarComando(string sql)', what: 'Executa INSERT, UPDATE ou DELETE recebidos como texto.', from: 'O sql vem dos métodos do Aluno.', simple: 'Execute este comando que muda dados.' },
  { m: 'Conectar();', o: 0, what: 'Abre a conexão antes de executar.', why: 'Fica fora do try: se falhar, o erro sai daqui direto, e o finally nem roda (a conexão nem abriu).', simple: 'Primeiro, conecte.' },
  { m: 'MySqlCommand comando = new MySqlCommand(sql, conn);', what: 'Cria o comando: qual SQL e por qual conexão.', simple: 'Prepare este pedido nesta conexão.' },
  { m: 'comando.ExecuteNonQuery();', what: 'Executa o comando no MySQL.', why: 'NonQuery: não traz linhas de volta. Retorna quantas linhas foram afetadas, mas o original ignora esse número.', simple: 'Execute, sem esperar uma tabela de resposta.' },
  { m: 'throw new Exception($"Instrução não executada.', what: 'Se o SQL falhar, lança um erro mostrando o próprio SQL e a mensagem do MySQL.', why: 'Ver o SQL montado ajuda a achar um apóstrofo faltando ou uma coluna com nome errado.', simple: 'Avise que o comando falhou e mostre qual era.' },
  { m: 'finally', o: 0, n: 3, what: 'Fecha a conexão sempre, com ou sem erro.', simple: 'Aconteça o que acontecer, desligue.' },
  { m: 'public DataTable ExecutarConsulta(string query)', what: 'Executa um SELECT e devolve o resultado como DataTable.', simple: 'Faça esta pergunta e traga a tabela de resposta.' },
  { m: 'MySqlDataAdapter dados = new MySqlDataAdapter(query, conn);', what: 'O adapter executa o SELECT e sabe copiar o resultado.', simple: 'Prepare quem vai buscar as linhas.' },
  { m: 'DataTable dt = new DataTable();', what: 'Uma tabela vazia em memória.', simple: 'Uma tabela vazia para receber as linhas.' },
  { m: 'dados.Fill(dt);', what: 'Executa o SELECT e preenche o DataTable com as linhas e colunas do resultado.', simple: 'Busque as linhas e coloque nessa tabela.' },
  { m: 'return dt;', what: 'Devolve o DataTable cheio.', why: 'Mesmo com return dentro do try, o finally roda antes de o método terminar.', next: 'Volta para ListarAlunos e depois para MostrarDadosAlunos.', simple: 'Entregue a tabela.' },
  { m: 'throw new Exception($"Instrução SELECT', what: 'Erro do SELECT, com o texto da consulta.', simple: 'Avise que a consulta falhou.' }],
'FrmAlunos.cs': [
  { m: 'public partial class FrmAlunos : Form', what: 'A janela de alunos. A outra parte da classe está no designer.', simple: 'Esta é a janela de alunos.' },
  { m: 'InitializeComponent();', what: 'Cria e posiciona todos os controles e liga os eventos.', why: 'O código desse método está no FrmAlunos.designer.cs.', simple: 'Monte a janela como foi desenhada.' },
  { m: 'private void btnSair_Click', what: 'Evento Click do botão SAIR.', simple: 'Quando clicarem em SAIR...' },
  { m: 'this.Close();', what: 'Fecha o FrmAlunos.', next: 'O ShowDialog no FrmPrincipal termina e o menu volta a funcionar.', simple: 'Feche esta janela.' },
  { m: 'Aluno objAluno = new Aluno();', what: 'Cria um objeto Aluno que todos os eventos do formulário compartilham.', why: 'Está fora dos métodos: é um campo da classe FrmAlunos e vive enquanto a janela estiver aberta.', adapt: 'Produto objProduto = new Produto();', simple: 'Tenha uma ficha de aluno para usar em todos os botões.' },
  { m: 'private void btnCadastrar_Click', what: 'Evento Click do Cadastrar: o C do CRUD.', simple: 'Quando clicarem em Cadastrar...' },
  { m: 'nomeAluno = txtNome.Text;', o: 0, what: 'Lê o texto digitado no nome.', from: 'Do que o usuário digitou no TextBox txtNome.', next: 'Vai para objAluno.SetNome(nomeAluno).', simple: 'Pegue o que foi digitado no campo de nome.' },
  { m: 'dtnascAluno = dtpNascimento.Value;', o: 0, what: 'Lê a data escolhida, já como DateTime.', simple: 'Pegue a data escolhida no calendário.' },
  { m: 'unidadeAluno;', o: 0, what: 'Declara a variável da unidade sem valor. O if logo abaixo decide.', simple: 'Reserve um lugar para a letra da unidade.' },
  { m: 'serieAluno;', o: 0, what: 'Declara a variável da série. O ternário decide.', simple: 'Reserve um lugar para o número da série.' },
  { m: 'turmaAluno = char.Parse(cmbTurma.Text);', o: 0, what: 'Converte o texto da turma ("A") em caractere (\'A\').', why: 'O atributo turma é char. Se nenhuma turma estiver escolhida, Text é "" e o char.Parse lança FormatException.', simple: 'Transforme a turma escolhida em uma letra.' },
  { m: 'if (rdbBarroca.Checked)', o: 0, n: 6, what: 'Decide a letra da unidade pelo RadioButton marcado.', why: 'O banco guarda B ou F, não o texto “Barroca”. Sem nada marcado, grava espaço.', adapt: 'Para cada grupo de RadioButtons, um if/else if/else assim.', simple: 'Se Barroca estiver marcada, a unidade é B; se Floresta, F; senão, espaço.' },
  { m: 'serieAluno = rdb1Serie.Checked ?', o: 0, what: 'Ternário encadeado: 1, 2, 3 ou 0, conforme o RadioButton marcado.', why: 'Mesma ideia do if/else da unidade, escrita numa linha.', simple: 'Se 1ª marcada, série 1; se 2ª, 2; se 3ª, 3; senão, 0.' },
  { m: 'objAluno.SetNome(nomeAluno);', o: 0, n: 5, what: 'Guarda cada valor lido no objeto, pelos Set.', why: 'Os atributos são private: só dá para preencher pelos Set.', next: 'InserirAluno usa esses atributos para montar o SQL.', simple: 'Copie os valores lidos para a ficha do aluno.' },
  { m: 'objAluno.InserirAluno();', what: 'Executa o INSERT no banco.', simple: 'Cadastre a ficha no banco.' },
  { m: 'MostrarDadosAlunos();', o: 0, what: 'Recarrega a grade com um SELECT novo.', why: 'Sem isso, o aluno novo não apareceria na tela.', simple: 'Atualize a tabela da tela.' },
  { m: 'MessageBox.Show("Dados do aluno INSERIDOS', what: 'Mostra a mensagem de sucesso.', why: 'Só chega aqui se nenhuma exceção aconteceu antes.', simple: 'Avise que deu certo.' },
  { m: 'LimparDados();', o: 0, what: 'Esvazia os controles para o próximo cadastro.', simple: 'Limpe os campos.' },
  { m: 'private void LimparDados()', what: 'Método criado pela professora (não é evento) para esvaziar os controles.', why: 'Usado por Cadastrar, Alterar, Excluir e Limpar: escrito uma vez, chamado várias.', simple: 'Receita para deixar a tela em branco.' },
  { m: 'txtID.Clear();', what: 'Apaga o texto do ID.', simple: 'Esvazie o ID.' },
  { m: 'dtpNascimento.Value = DateTime.Now;', what: 'Volta a data para hoje.', why: 'O DateTimePicker sempre tem uma data, não dá para deixar vazio.', simple: 'Coloque a data de hoje.' },
  { m: 'rdbBarroca.Checked = false;', n: 5, what: 'Desmarca todos os RadioButtons.', simple: 'Desmarque todas as opções.' },
  { m: 'cmbTurma.SelectedIndex = -1;', what: 'Deixa o ComboBox sem item escolhido.', why: '-1 = nenhum. Assim cmbTurma.Text fica "".', simple: 'Deixe a turma sem escolha.' },
  { m: 'private void btnLimpar_Click', what: 'Evento do botão Limpar: só chama LimparDados.', simple: 'Quando clicarem em Limpar, limpe a tela.' },
  { m: 'private void FrmAlunos_Load', what: 'Evento Load: roda quando a janela abre.', next: 'Chama MostrarDadosAlunos e a grade aparece preenchida.', simple: 'Quando a janela abrir...' },
  { m: 'private void MostrarDadosAlunos()', what: 'Método que atualiza a grade.', simple: 'Receita para atualizar a tabela da tela.' },
  { m: 'dtgAlunos.DataSource = objAluno.ListarAlunos();', what: 'Pega o DataTable do SELECT e entrega para a grade mostrar.', next: 'A grade cria colunas com os nomes do SELECT: id, nome, dtnasc...', adapt: 'dtgProdutos.DataSource = objProduto.ListarProdutos();', simple: 'Busque a lista no banco e mostre na tabela da tela.' },
  { m: 'private void btnExcluir_Click', what: 'Evento do Excluir: o D do CRUD.', simple: 'Quando clicarem em Excluir...' },
  { m: 'int idAluno = int.Parse(txtID.Text); //O ID', what: 'Converte o ID do TextBox para número.', from: 'O txtID foi preenchido pelo CellClick.', why: 'Se ninguém foi selecionado, Text é "" e int.Parse lança FormatException.', simple: 'Pegue o número do aluno selecionado.' },
  { m: 'objAluno.setId(idAluno);', o: 0, what: 'Guarda o ID no objeto (setId minúsculo, como no Aluno.cs).', simple: 'Guarde na ficha qual aluno é.' },
  { m: 'objAluno.ExcluirAluno();', what: 'Executa o DELETE ... WHERE id.', simple: 'Apague esse aluno no banco.' },
  { m: 'private void btnAlterar_Click', what: 'Evento do Alterar: o U do CRUD. Lê tudo de novo, inclusive o ID.', simple: 'Quando clicarem em Alterar...' },
  { m: 'int         idAluno = int.Parse(txtID.Text);', what: 'Lê o ID do aluno a alterar.', simple: 'Pegue o número do aluno selecionado.' },
  { m: 'objAluno.AlterarAluno();', what: 'Executa o UPDATE ... WHERE id.', simple: 'Grave as mudanças desse aluno.' },
  { m: 'private void dtgAlunos_CellClick', what: 'Evento CellClick: copia a linha clicada para os controles.', from: 'e.RowIndex = índice da linha clicada.', why: 'Assim o usuário escolhe quem alterar ou excluir.', simple: 'Quando clicarem numa linha da tabela...' },
  { m: 'txtID.Text      = dtgAlunos.Rows[e.RowIndex].Cells["id"]', what: 'Copia a célula id da linha clicada para o txtID.', why: 'É o ID de verdade do banco, não o índice da linha.', adapt: 'O texto entre aspas em Cells["..."] precisa ser o nome da coluna no banco.', simple: 'Copie o número do aluno dessa linha para o campo ID.' },
  { m: 'txtNome.Text    = dtgAlunos', what: 'Copia o nome.', simple: 'Copie o nome dessa linha.' },
  { m: 'dtpNascimento.Value = DateTime.Parse(', what: 'Copia a data: Value → texto → DateTime.', simple: 'Copie a data dessa linha.' },
  { m: 'cmbTurma.Text = dtgAlunos', what: 'Escolhe no ComboBox o item com o mesmo texto da célula turma.', simple: 'Escolha a turma dessa linha.' },
  { m: 'if (dtgAlunos.Rows[e.RowIndex].Cells["unidade"]', n: 8, what: 'Marca o RadioButton da unidade conforme a letra.', why: 'Caminho inverso do Cadastrar: letra → RadioButton.', simple: 'Se a unidade for B, marque Barroca; senão, Floresta.' },
  { m: 'if(dtgAlunos.Rows[e.RowIndex].Cells["serie"]', n: 12, what: 'Marca o RadioButton da série.', why: 'Qualquer valor diferente de 2 e 3 marca a 1ª série.', simple: 'Marque a série dessa linha.' }],
'FrmAlunos.designer.cs': [
  { m: 'partial class FrmAlunos', what: 'A outra metade da classe FrmAlunos, escrita pelo Designer.', adapt: 'Não edite à mão. Use o Designer e a janela Propriedades.', simple: 'Esta parte é desenhada pelo Visual Studio.' },
  { m: '#region Windows Form Designer generated code', what: 'Início do código gerado automaticamente.', simple: 'Daqui para baixo, quem escreve é o Visual Studio.' },
  { m: 'private void InitializeComponent()', what: 'Cria cada controle, configura propriedades e liga eventos.', next: 'É chamado no construtor FrmAlunos().', simple: 'Monte todos os controles.' },
  { m: 'this.btnCadastrar = new System.Windows.Forms.Button();', what: 'Cria o objeto do botão Cadastrar.', simple: 'Crie o botão Cadastrar.' },
  { m: 'this.btnLimpar.Click +=', what: 'Liga o clique do Limpar ao método btnLimpar_Click.', simple: 'Ao clicar em Limpar, rode btnLimpar_Click.' },
  { m: 'this.btnSair.Click +=', what: 'Liga o clique do SAIR.', simple: 'Ao clicar em SAIR, rode btnSair_Click.' },
  { m: 'this.btnExcluir.Click +=', what: 'Liga o clique do Excluir.', simple: 'Ao clicar em Excluir, rode btnExcluir_Click.' },
  { m: 'this.btnAlterar.Click +=', what: 'Liga o clique do Alterar.', simple: 'Ao clicar em Alterar, rode btnAlterar_Click.' },
  { m: 'this.btnCadastrar.Name = "btnCadastrar";', what: 'O Name do botão: o nome usado no código.', simple: 'No código, este botão se chama btnCadastrar.' },
  { m: 'this.btnCadastrar.Text = "Cadastrar";', what: 'O Text: o que aparece escrito no botão.', simple: 'Na tela, o botão mostra “Cadastrar”.' },
  { m: 'this.btnCadastrar.Click +=', what: 'Liga o Click ao método btnCadastrar_Click.', why: 'Esta linha é criada quando você escolhe o evento no ⚡. Sem ela, o clique não faz nada.', simple: 'Ao clicar em Cadastrar, rode btnCadastrar_Click.' },
  { m: 'this.txtID.Enabled = false;', what: 'Desabilita o txtID: o usuário não digita o ID.', why: 'O ID é gerado pelo banco e só é preenchido pelo CellClick.', simple: 'O campo ID é só para ver, não para digitar.' },
  { m: 'this.dtgAlunos.CellClick +=', what: 'Liga o CellClick da grade ao dtgAlunos_CellClick.', why: 'Foi escolhido no ⚡. Dois cliques na grade criariam CellContentClick.', simple: 'Ao clicar numa célula, rode dtgAlunos_CellClick.' },
  { m: 'this.cmbTurma.DropDownStyle', what: 'DropDownList: só deixa escolher itens da lista, sem digitar.', simple: 'A turma só pode ser escolhida da lista.' },
  { m: 'this.cmbTurma.Items.AddRange', n: 6, what: 'Os itens da lista de turmas: A a E.', adapt: 'Configure em Propriedades → Items, uma opção por linha.', simple: 'As opções são A, B, C, D e E.' },
  { m: 'this.grpSerie.Controls.Add(this.rdb3Serie);', n: 3, what: 'Coloca os três RadioButtons de série dentro do GroupBox grpSerie.', why: 'Isso faz deles um grupo separado dos de unidade.', simple: 'As séries ficam juntas numa caixa.' },
  { m: 'this.grpUnidade.Controls.Add(this.rdbFloresta);', n: 2, what: 'Coloca os RadioButtons de unidade no grpUnidade.', simple: 'As unidades ficam juntas em outra caixa.' },
  { m: 'this.dtpNascimento.Format', what: 'Formato curto de data (dd/mm/aaaa).', simple: 'Mostre a data no formato curto.' },
  { m: 'this.Load += new System.EventHandler(this.FrmAlunos_Load);', what: 'Liga o evento Load do formulário ao FrmAlunos_Load.', simple: 'Quando a janela abrir, rode FrmAlunos_Load.' },
  { m: 'private System.Windows.Forms.TextBox txtNome;', what: 'Declaração do campo txtNome. É por isso que o código consegue escrever txtNome.Text.', simple: 'Existe um TextBox chamado txtNome.' }]
};

/* ------------------------------------------------------------
   CONTROLES (inspetor da aula 3)
   ------------------------------------------------------------ */
const CONTROLS = [
  { name: 'txtID', type: 'TextBox', text: '(vazio)', prop: '.Text (lido com int.Parse em Alterar/Excluir)', ev: '—', d: 'this.txtID.Enabled = false;', note: 'Enabled = false: o usuário não digita. Quem preenche é o CellClick.' },
  { name: 'txtNome', type: 'TextBox', text: '(o que o usuário digitar)', prop: '.Text', ev: '—', d: 'this.txtNome.Name = "txtNome";', note: 'TextBox sempre devolve string.' },
  { name: 'dtpNascimento', type: 'DateTimePicker', text: '—', prop: '.Value (DateTime)', ev: '—', d: 'this.dtpNascimento.Format', note: 'Sempre tem uma data. Em LimparDados volta para DateTime.Now.' },
  { name: 'grpUnidade', type: 'GroupBox', text: 'Unidade', prop: '—', ev: '—', d: 'this.grpUnidade.Controls.Add(this.rdbFloresta);', note: 'Só agrupa: faz os RadioButtons de dentro serem exclusivos entre si.' },
  { name: 'rdbBarroca', type: 'RadioButton', text: 'Barroca', prop: '.Checked → \'B\'', ev: '—', d: 'this.rdbBarroca.Name = "rdbBarroca";', note: 'O Text “Barroca” não vai para o banco. O código traduz para \'B\'.' },
  { name: 'rdbFloresta', type: 'RadioButton', text: 'Floresta', prop: '.Checked → \'F\'', ev: '—', d: 'this.rdbFloresta.Name = "rdbFloresta";', note: 'No CellClick, qualquer unidade diferente de B marca Floresta.' },
  { name: 'grpSerie', type: 'GroupBox', text: 'Série', prop: '—', ev: '—', d: 'this.grpSerie.Controls.Add(this.rdb3Serie);', note: 'Grupo separado: marcar a série não desmarca a unidade.' },
  { name: 'rdb1Serie', type: 'RadioButton', text: '1ª', prop: '.Checked → 1', ev: '—', d: 'this.rdb1Serie.Name = "rdb1Serie";', note: 'rdb2Serie → 2 e rdb3Serie → 3, pelo ternário.' },
  { name: 'cmbTurma', type: 'ComboBox', text: 'A, B, C, D ou E', prop: '.Text → char.Parse', ev: '—', d: 'this.cmbTurma.DropDownStyle', note: 'DropDownList: só itens da lista. SelectedIndex = -1 deixa sem escolha.' },
  { name: 'dtgAlunos', type: 'DataGridView', text: '—', prop: '.DataSource = DataTable', ev: 'CellClick → dtgAlunos_CellClick', d: 'this.dtgAlunos.CellClick +=', note: 'Associe CellClick pelo ⚡. Dois cliques criariam CellContentClick.' },
  { name: 'btnCadastrar', type: 'Button', text: 'Cadastrar', prop: '—', ev: 'Click → btnCadastrar_Click', d: 'this.btnCadastrar.Click +=', note: 'Dois cliques no botão criam o Click (evento padrão).' },
  { name: 'btnAlterar', type: 'Button', text: 'Alterar', prop: '—', ev: 'Click → btnAlterar_Click', d: 'this.btnAlterar.Click +=', note: '' },
  { name: 'btnExcluir', type: 'Button', text: 'Excluir', prop: '—', ev: 'Click → btnExcluir_Click', d: 'this.btnExcluir.Click +=', note: '' },
  { name: 'btnLimpar', type: 'Button', text: 'Limpar', prop: '—', ev: 'Click → btnLimpar_Click', d: 'this.btnLimpar.Click +=', note: '' },
  { name: 'btnSair', type: 'Button', text: 'SAIR', prop: '—', ev: 'Click → btnSair_Click', d: 'this.btnSair.Click +=', note: 'Repare: o Text é “SAIR” em maiúsculas e o Name é btnSair.' },
  { name: 'FrmAlunos', type: 'Form', text: 'FrmAlunos - CARLA CARDOSO GOMES MOREIRA', prop: '—', ev: 'Load → FrmAlunos_Load', d: 'this.Load += new System.EventHandler(this.FrmAlunos_Load);', note: 'Dois cliques numa área vazia do formulário criam o Load.' }
];

/* ------------------------------------------------------------
   TIPOS: base do decisor e do gerador de soluções
   ------------------------------------------------------------ */
const KINDS = {
  string: { label: 'varchar(n) — texto', cs: 'string', ctl: 'TextBox', pre: 'txt', note: 'Igual ao nome do aluno.' },
  int: { label: 'int — número inteiro', cs: 'int', ctl: 'TextBox (ou NumericUpDown)', pre: 'txt', note: 'O projeto da professora usa RadioButtons para a série, porque são só 3 valores. Para um número livre (estoque, ano), TextBox + int.Parse.' },
  decimal: { label: 'decimal(p,d) — número com casas decimais', cs: 'decimal', ctl: 'TextBox', pre: 'txt', note: 'Não existe no exemplo. No Brasil, o C# escreve 12,50 e o MySQL espera 12.50: use CultureInfo.InvariantCulture ao montar o SQL (com using System.Globalization;).' },
  date: { label: 'date — data', cs: 'DateTime', ctl: 'DateTimePicker', pre: 'dtp', note: 'Igual à data de nascimento.' },
  charCombo: { label: 'char(1) — uma letra, várias opções', cs: 'char', ctl: 'ComboBox (DropDownList)', pre: 'cmb', note: 'Igual à turma.' },
  charRadio: { label: 'char(1) — uma letra, poucas opções', cs: 'char', ctl: 'RadioButtons num GroupBox', pre: 'rdb', note: 'Igual à unidade.' },
  bool: { label: 'tinyint(1) / boolean — sim ou não', cs: 'bool', ctl: 'CheckBox', pre: 'chk', note: 'Não existe no exemplo. O MySql.Data devolve tinyint(1) como bool; Convert.ToBoolean funciona no CellClick.' }
};

/* Entidades: guiadas (com tabela de correspondência) e de prova simulada */
const ENTITIES = {
times: { title: 'Times de futebol', E: 'Time', plural: 'Times', obj: 'objTime', table: 'tblTimes', db: 'DB_FutebolCRUD', form: 'FrmTimes', order: 'nome',
  fields: [
    { col: 'nome', sql: 'varchar(50) not null', kind: 'string', m: 'Nome', ctl: 'txtNome', label: 'Nome do time', like: 'nome (txtNome)' },
    { col: 'cidade', sql: 'varchar(50) not null', kind: 'string', m: 'Cidade', ctl: 'txtCidade', label: 'Cidade', like: 'nome (outro TextBox)' },
    { col: 'dtfundacao', sql: 'date not null', kind: 'date', m: 'DtFundacao', ctl: 'dtpFundacao', label: 'Fundação', like: 'dtnasc (dtpNascimento)' },
    { col: 'divisao', sql: 'char(1) not null', kind: 'charCombo', m: 'Divisao', ctl: 'cmbDivisao', label: 'Divisão', items: ['A', 'B', 'C', 'D'], like: 'turma (cmbTurma)' },
    { col: 'titulos', sql: 'int not null', kind: 'int', m: 'Titulos', ctl: 'txtTitulos', label: 'Títulos', like: 'sem equivalente direto: TextBox + int.Parse, como o txtID' }] },
produtos: { title: 'Produtos', E: 'Produto', plural: 'Produtos', obj: 'objProduto', table: 'tblProdutos', db: 'DB_LojaCRUD', form: 'FrmProdutos', order: 'descricao',
  fields: [
    { col: 'descricao', sql: 'varchar(60) not null', kind: 'string', m: 'Descricao', ctl: 'txtDescricao', label: 'Descrição', like: 'nome (txtNome)' },
    { col: 'preco', sql: 'decimal(10,2) not null', kind: 'decimal', m: 'Preco', ctl: 'txtPreco', label: 'Preço', like: 'sem equivalente: decimal.Parse e cuidado com a vírgula' },
    { col: 'estoque', sql: 'int not null', kind: 'int', m: 'Estoque', ctl: 'txtEstoque', label: 'Estoque', like: 'sem equivalente direto: TextBox + int.Parse' },
    { col: 'dtvalidade', sql: 'date not null', kind: 'date', m: 'DtValidade', ctl: 'dtpValidade', label: 'Validade', like: 'dtnasc (dtpNascimento)' },
    { col: 'categoria', sql: 'char(1) not null', kind: 'charRadio', m: 'Categoria', grp: 'grpCategoria', label: 'Categoria', opts: [{ v: 'A', ctl: 'rdbAlimento', label: 'Alimento' }, { v: 'L', ctl: 'rdbLimpeza', label: 'Limpeza' }, { v: 'H', ctl: 'rdbHigiene', label: 'Higiene' }], like: 'unidade (rdbBarroca/rdbFloresta)' }] },
livros: { title: 'Livros', E: 'Livro', plural: 'Livros', obj: 'objLivro', table: 'tblLivros', db: 'DB_BibliotecaCRUD', form: 'FrmLivros', order: 'titulo',
  fields: [
    { col: 'titulo', sql: 'varchar(80) not null', kind: 'string', m: 'Titulo', ctl: 'txtTitulo', label: 'Título', like: 'nome (txtNome)' },
    { col: 'autor', sql: 'varchar(50) not null', kind: 'string', m: 'Autor', ctl: 'txtAutor', label: 'Autor', like: 'nome (outro TextBox)' },
    { col: 'ano', sql: 'int not null', kind: 'int', m: 'Ano', ctl: 'txtAno', label: 'Ano', like: 'sem equivalente direto: TextBox + int.Parse' },
    { col: 'genero', sql: 'char(1) not null', kind: 'charCombo', m: 'Genero', ctl: 'cmbGenero', label: 'Gênero', items: ['R', 'F', 'T', 'P'], like: 'turma (cmbTurma)' },
    { col: 'disponivel', sql: 'tinyint(1) not null', kind: 'bool', m: 'Disponivel', ctl: 'chkDisponivel', label: 'Disponível', like: 'sem equivalente: CheckBox e 1/0 no SQL' }] }
};
const EXAMS = {
veiculos: { title: 'Veículos de uma locadora', E: 'Veiculo', plural: 'Veiculos', obj: 'objVeiculo', table: 'tblVeiculos', db: 'DB_LocadoraCRUD', form: 'FrmVeiculos', order: 'modelo',
  story: 'Uma locadora quer cadastrar a frota. O combustível é G (Gasolina), E (Etanol) ou F (Flex).',
  fields: [
    { col: 'modelo', sql: 'varchar(40) not null', kind: 'string', m: 'Modelo', ctl: 'txtModelo', label: 'Modelo' },
    { col: 'placa', sql: 'varchar(8) not null', kind: 'string', m: 'Placa', ctl: 'txtPlaca', label: 'Placa' },
    { col: 'ano', sql: 'int not null', kind: 'int', m: 'Ano', ctl: 'txtAno', label: 'Ano' },
    { col: 'combustivel', sql: 'char(1) not null', kind: 'charRadio', m: 'Combustivel', grp: 'grpCombustivel', label: 'Combustível', opts: [{ v: 'G', ctl: 'rdbGasolina', label: 'Gasolina' }, { v: 'E', ctl: 'rdbEtanol', label: 'Etanol' }, { v: 'F', ctl: 'rdbFlex', label: 'Flex' }] },
    { col: 'dtcompra', sql: 'date not null', kind: 'date', m: 'DtCompra', ctl: 'dtpCompra', label: 'Data da compra' }] },
funcionarios: { title: 'Funcionários', E: 'Funcionario', plural: 'Funcionarios', obj: 'objFuncionario', table: 'tblFuncionarios', db: 'DB_EmpresaCRUD', form: 'FrmFuncionarios', order: 'nome',
  story: 'O RH quer um cadastro de funcionários. Setores: A (Administrativo), F (Financeiro), T (TI) e V (Vendas). “ativo” indica se a pessoa ainda trabalha na empresa.',
  fields: [
    { col: 'nome', sql: 'varchar(50) not null', kind: 'string', m: 'Nome', ctl: 'txtNome', label: 'Nome' },
    { col: 'salario', sql: 'decimal(10,2) not null', kind: 'decimal', m: 'Salario', ctl: 'txtSalario', label: 'Salário' },
    { col: 'dtadmissao', sql: 'date not null', kind: 'date', m: 'DtAdmissao', ctl: 'dtpAdmissao', label: 'Admissão' },
    { col: 'setor', sql: 'char(1) not null', kind: 'charCombo', m: 'Setor', ctl: 'cmbSetor', label: 'Setor', items: ['A', 'F', 'T', 'V'] },
    { col: 'ativo', sql: 'tinyint(1) not null', kind: 'bool', m: 'Ativo', ctl: 'chkAtivo', label: 'Ativo' }] },
pets: { title: 'Pets de uma clínica veterinária', E: 'Pet', plural: 'Pets', obj: 'objPet', table: 'tblPets', db: 'DB_ClinicaCRUD', form: 'FrmPets', order: 'nome',
  story: 'Uma clínica veterinária quer cadastrar os animais atendidos. Espécie: C (Cão), G (Gato) ou O (Outro).',
  fields: [
    { col: 'nome', sql: 'varchar(40) not null', kind: 'string', m: 'Nome', ctl: 'txtNome', label: 'Nome' },
    { col: 'especie', sql: 'char(1) not null', kind: 'charRadio', m: 'Especie', grp: 'grpEspecie', label: 'Espécie', opts: [{ v: 'C', ctl: 'rdbCao', label: 'Cão' }, { v: 'G', ctl: 'rdbGato', label: 'Gato' }, { v: 'O', ctl: 'rdbOutro', label: 'Outro' }] },
    { col: 'raca', sql: 'varchar(40) not null', kind: 'string', m: 'Raca', ctl: 'txtRaca', label: 'Raça' },
    { col: 'peso', sql: 'decimal(5,2) not null', kind: 'decimal', m: 'Peso', ctl: 'txtPeso', label: 'Peso (kg)' },
    { col: 'dtnasc', sql: 'date not null', kind: 'date', m: 'DtNasc', ctl: 'dtpNascimento', label: 'Nascimento' }] }
};
const EXAM_PARTS = [
  ['atrib', 'Atributos da classe (nome e tipo de cada um)'],
  ['getset', 'Set e Get de pelo menos duas colunas'],
  ['sql', 'Os quatro métodos com SQL: Inserir, Alterar, Excluir e Listar'],
  ['ctl', 'Lista de controles: tipo e Name de cada um'],
  ['cad', 'O btnCadastrar_Click completo'],
  ['cell', 'O CellClick e o LimparDados']
];
const EXAM_CHECK = ['Atributos e tipos batem com as colunas', 'Um Set e um Get para cada atributo', 'Leitura certa de cada controle (.Text, .Value, .Checked, conversões)', 'Comandos SQL com o nome da tabela e as colunas na ordem', 'Alterar e Excluir usam o ID e WHERE id', 'Listagem com DataSource e seleção com CellClick', 'Eventos associados: Click dos botões, Load e CellClick', 'Interface atualizada: MostrarDados depois de cada operação e LimparDados'];

/* ------------------------------------------------------------
   REVISÃO
   ------------------------------------------------------------ */
const FLASH = [
  ['O que significa CRUD?', 'Create, Read, Update, Delete: cadastrar (INSERT), listar (SELECT), alterar (UPDATE) e excluir (DELETE).'],
  ['Para que serve o auto_increment?', 'O MySQL gera o próximo id sozinho. Por isso o INSERT manda null no id.'],
  ['Qual a diferença entre Name e Text?', 'Name é o nome do controle no código (btnCadastrar). Text é o que aparece na tela (“Cadastrar”).'],
  ['Por que os RadioButtons ficam em GroupBox?', 'RadioButtons no mesmo container são exclusivos. O GroupBox separa os grupos (unidade e série).'],
  ['Qual evento usar na grade e como associar?', 'CellClick, pelo ⚡ Eventos da janela Propriedades. Dois cliques na grade criam CellContentClick.'],
  ['O que faz this.nome = nome;?', 'Guarda o parâmetro nome no atributo nome deste objeto.'],
  ['O que quer dizer void?', 'O método não devolve valor. Os Set são void; os Get devolvem o tipo do atributo.'],
  ['ExecuteNonQuery serve para quê?', 'INSERT, UPDATE e DELETE. Não devolve tabela; devolve a quantidade de linhas afetadas (o original ignora).'],
  ['Como um SELECT chega na grade?', 'MySqlDataAdapter.Fill(dt) preenche um DataTable → ListarAlunos devolve → dtgAlunos.DataSource = DataTable.'],
  ['Quando o finally roda?', 'Sempre: com sucesso, com return e com exceção. Ali a conexão é fechada.'],
  ['Como ler cada controle?', 'TextBox → .Text; DateTimePicker → .Value; RadioButton → .Checked; ComboBox → .Text + char.Parse.'],
  ['Em que formato a data vai no SQL?', 'dtnasc.ToString("yyyy/MM/dd"), por exemplo 2009/03/15.'],
  ['e.RowIndex é o id do aluno?', 'Não. É a posição da linha na grade. O id vem de Cells["id"].Value.'],
  ['Por que Alterar e Excluir precisam do ID?', 'Para o WHERE id = ... escolher um único registro. Sem WHERE, todos são atingidos.'],
  ['LimparDados apaga algo do banco?', 'Não. Só esvazia os controles da tela.'],
  ['Por que chamar MostrarDadosAlunos depois de alterar?', 'A grade é uma cópia do último SELECT. Sem recarregar, mostra dados velhos.'],
  ['O que muda na Conexao numa prova com outro tema?', 'Normalmente só o database = da string de conexão.'],
  ['Qual é o risco de montar SQL com $"...{nome}..."?', 'Um apóstrofo no texto (D\'Ávila) quebra o SQL e permite SQL injection. A melhoria é usar parâmetros.']
];
const FINAL_CHECK = [
  'Rodei o script no MySQL e o banco e a tabela existem',
  'A string de conexão aponta para o banco certo (database, uid, pwd)',
  'O pacote MySql.Data está instalado e há using MySql.Data.MySqlClient; na Conexao',
  'A classe da entidade tem um atributo private para cada coluna',
  'Cada atributo tem Set e Get com os tipos certos',
  'Inserir, Alterar, Excluir e Listar usam o nome certo da tabela',
  'Alterar e Excluir têm WHERE id',
  'Os controles têm Name iguais aos usados no código',
  'RadioButtons de grupos diferentes estão em GroupBoxes diferentes',
  'Os botões têm Click associado; o formulário tem Load; a grade tem CellClick',
  'Os nomes em Cells["..."] são os nomes das colunas no banco',
  'Depois de cada operação chamo MostrarDados... e LimparDados',
  'Testei: cadastrar, selecionar, alterar, excluir e limpar'
];
