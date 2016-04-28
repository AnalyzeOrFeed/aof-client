export function setEmail(email) {
  return {
    type: 'SET_EMAIL',
    email: email
  };
}

export function setPassword(password) {
  return {
    type: 'SET_PASSWORD',
    password: password
  };
}

export function doLogin() {
  return {
    type: 'DO_LOGIN'
  };
}
