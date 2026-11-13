// Gera site/index.html (site completo, um arquivo só) a partir de src/ e dos arquivos originais do projeto.
// Uso: node site/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, '..');
const read = p => fs.readFileSync(p, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');

const ORIGINAIS = ['Script_DBEscola.sql', 'Program.cs', 'FrmPrincipal.cs', 'FrmAlunos.cs', 'FrmAlunos.designer.cs', 'Aluno.cs', 'Conexao.cs'];
const orig = {};
for (const f of ORIGINAIS) orig[f] = read(path.join(proj, f)).replace(/\s+$/, '') + '\n';

const src = f => read(path.join(here, 'src', f));
const safeJson = JSON.stringify(orig).replace(/</g, '\\u003c');

const head = `<title>Oficina CRUD WinForms</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Aprenda CRUD em C# com Windows Forms e MySQL a partir do projeto de aula, com simulador, código explicado e exercícios.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<style>
${src('styles.css')}
</style>`;

const body = `${src('shell.html')}
<script>window.ORIG = ${safeJson};</script>
<script>
${src('content.js')}
</script>
<script>
${src('app.js')}
</script>`;

const full = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
${body}
</body>
</html>
`;

fs.writeFileSync(path.join(here, 'index.html'), full);
// Versão sem <html>/<head>/<body>, para publicar como Artifact (o host adiciona o esqueleto).
fs.mkdirSync(path.join(here, 'dist'), { recursive: true });
fs.writeFileSync(path.join(here, 'dist', 'oficina-crud.html'), head + '\n' + body + '\n');
console.log('ok:', (full.length / 1024).toFixed(0) + ' KB');
