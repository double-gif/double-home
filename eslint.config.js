import globals from 'globals';
export default [{ignores:['node_modules/**','build/**']},{files:['**/*.js','**/*.mjs'],languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:{...globals.browser,...globals.node}},rules:{'no-undef':'error','no-dupe-keys':'error','no-unreachable':'error','constructor-super':'error','valid-typeof':'error'}}];
