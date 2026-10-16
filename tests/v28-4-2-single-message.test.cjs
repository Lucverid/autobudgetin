const fs=require('fs');
const s=fs.readFileSync('telegram-database-backend.gs','utf8');
const checks=[
 ['single-message editMessageText',/editMessageText/],
 ['no fallback send inside edit function',/function editTelegramShortcut_[\s\S]*?return \{ok:false,error:[\s\S]*?\n\}/],
 ['message-not-modified handled',/message is not modified/i],
 ['callback alert on failure',/answerCallbackQuery[\s\S]*show_alert:!result\.ok/],
 ['back edits same finance center',/data==='fin:back'[\s\S]*editTelegramShortcut_/]
];
let bad=0; for(const [n,re] of checks){const ok=re.test(s);console.log((ok?'PASS ':'FAIL ')+n);if(!ok)bad++;} process.exitCode=bad?1:0;
