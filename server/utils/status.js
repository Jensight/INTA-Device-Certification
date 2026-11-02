

/* Unauthorized Request*/
module.exports.unauthorizedRequest = () => {
    const type = "problems/unauthorized-request"
    const title = "Unauthorized Request, Please add token in auth header."
    const code = 401
    const invalid_params = []
    return {
      status: {
        type,
        code,
        message: title,
        error: true,
        invalid_params: invalid_params,
      },
    };
  };
  /*Token Expired*/
module.exports.tokenExpired = () => {
    const type = "problems/token-expired"
    const title = "Token Expired, Please Logout and Login again."
    const code = 401
    const invalid_params = []
    return {
      status: {
        type,
        code,
        message: title,
        error: true,
        invalid_params: invalid_params,
      },
    };
  };
