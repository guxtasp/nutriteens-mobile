// src/shared/state/signupFlag.ts
// Flag simples pra avisar o RootNavigator que um cadastro está em andamento —
// evita que a checagem de sessão órfã desloge a sessão nova antes do insert
// do profile terminar.
export const signupState = { emAndamento: false };