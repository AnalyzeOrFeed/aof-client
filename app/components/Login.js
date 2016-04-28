import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import styles from './Login.css';

class Login extends Component {
  static propTypes = {
    setEmail: PropTypes.func.isRequired,
    setPassword: PropTypes.func.isRequired,
    doLogin: PropTypes.func.isRequired
  };

  render() {
    const { setEmail, setPassword, doLogin } = this.props;
    return (
      <div>
        <div className={styles.backButton}>
          <Link to="/">
            <i className="fa fa-arrow-left fa-3x" />
          </Link>
        </div>
        <div>
          <form>
            <input type="email" onChange={setEmail} /><br />
            <input type="password" onChange={setPassword} />
            <button type="submit" onClick={doLogin}>Login</button>
          </form>
        </div>
      </div>
    );
  }
}

export default Login;
