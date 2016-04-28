export default function counter(state = {
  "email": "",
  "password": "",
  "token": ""
}, action) {
  switch (action.type) {
    case 'SET_EMAIL':
      return {...state, email: action.email};
    case 'SET_PASSWORD':
      return {...state, password: action.password};
    case 'DO_LOGIN':
      console.log("I'm doing something!");
      console.log(state);
      return {...state, token: "testtoken"};
    default:
      return state;
  }
}
