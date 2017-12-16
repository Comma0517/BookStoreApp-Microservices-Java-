import { APP_CLIENT_ID, APP_CLIENT_SECRET, BACKEND_API_GATEWAY_URL } from '../constants/appConstants';
import axios from 'axios';
import qs from 'qs';
import store from '../store';
import { USER_LOGOUT } from '../constants/userConstants';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response.status === 401 && originalRequest.url.includes('grant_type=refresh_token')) {
      store.dispatch({
        type: USER_LOGOUT
      });
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      // const refreshToken = localStorage.getItem('refresh_token');
      const refreshToken = JSON.parse(localStorage.getItem('userInfo')).refresh_token;
      if (refreshToken) {
        const tokenParts = JSON.parse(atob(refreshToken.split('.')[1]));
        // exp date in token is expressed in seconds, while now() returns milliseconds:
        const now = Math.ceil(Date.now() / 1000);

        const axiosConfig = {
          headers: {
            Authorization: 'Basic ' + btoa(APP_CLIENT_ID + ':' + APP_CLIENT_SECRET)
          }
        };

        if (tokenParts.exp > now) {
          return axios
            .post(`${BACKEND_API_GATEWAY_URL}/api/account/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}`, null, axiosConfig)
            .then((response) => {
              const userInfo = JSON.parse(localStorage.getItem('userInfo'));
              const updatedUserInfo = {
                ...userInfo,
                token: response.data.access_token
              };
              localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
              axios.defaults.headers['Authorization'] = 'Bearer ' + response.data.access_token;
              originalRequest.headers['Authorization'] = 'Bearer ' + response.data.access_token;
              return axios(originalRequest);
            })
            .catch((err) => {
              console.error('Error while getting token using refresh token.', err);
            });
        } else {
          console.log('Refresh token is expired', tokenParts.exp, now);
          store.dispatch({
            type: USER_LOGOUT
          });
        }
      } else {
        console.log('Refresh token not available.');
        store.dispatch({
          type: USER_LOGOUT
        });
      }
    }

    // specific error handling done elsewhere
    return Promise.reject(error);
  }
);

export const postSignupApi = (singupRequestBody) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.post(`${BACKEND_API_GATEWAY_URL}/api/account/signup`, singupRequestBody, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const postLoginApi = async (loginRequestBody) => {
  const axiosConfig = {
    headers: {
      'Authorization': 'Basic ' + btoa(APP_CLIENT_ID + ':' + APP_CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  const loginRequestBodyEncoded = qs.stringify(loginRequestBody);
  const responseData = await axios.post(`${BACKEND_API_GATEWAY_URL}/api/account/oauth/token`, loginRequestBodyEncoded, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getUserInfoApi = async () => {
  const axiosConfig = getAxiosConfig();
  const responseData = await axios.get(`${BACKEND_API_GATEWAY_URL}/api/account/userInfo`, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const putUserInfoApi = async (userInfoRequestBody) => {
  const axiosConfig = getAxiosConfig();
  const responseData = await axios.put(`${BACKEND_API_GATEWAY_URL}/api/account/userInfo`, userInfoRequestBody, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getProductDetailApi = async (productId) => {
  const responseData = axios.get(`${BACKEND_API_GATEWAY_URL}/api/catalog/product/${productId}`).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getAllProductsDetailApi = async () => {
  const responseData = axios.get(`${BACKEND_API_GATEWAY_URL}/api/catalog/products`).then((response) => {
    return response.data;
  });
  return responseData;
};

export const addToCartApi = async (addToCartRequestBody) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.post(`${BACKEND_API_GATEWAY_URL}/api/order/cart/cartItem`, addToCartRequestBody, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getCartDetailsApi = async () => {
  const axiosConfig = getAxiosConfig();
  const cartDetails = await axios.get(`${BACKEND_API_GATEWAY_URL}/api/order/cart`, axiosConfig).then((response) => {
    return response.data;
  });

  let sortedCart = {
    ...cartDetails,
    cartItems: cartDetails.cartItems.sort((a, b) => {
      return a.cartItemId.localeCompare(b.cartItemId);
    })
  };

  return sortedCart;
};

export const removeCartItemApi = async (cartItemId) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.delete(`${BACKEND_API_GATEWAY_URL}/api/order/cart/cartItem/${cartItemId}`, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getAllMyOrdersApi = async () => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.get(`${BACKEND_API_GATEWAY_URL}/api/order/order/myorders`, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const previewOrderApi = async (previewOrderRequestBody) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.post(`${BACKEND_API_GATEWAY_URL}/api/order/previewOrder`, previewOrderRequestBody, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const placeOrderApi = async (placeOrderRequestBody) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.post(`${BACKEND_API_GATEWAY_URL}/api/order/order`, placeOrderRequestBody, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getOrderApi = async (orderId) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.get(`${BACKEND_API_GATEWAY_URL}/api/order/order/${orderId}`, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const saveAddressApi = async (addressRequestBody) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.post(`${BACKEND_API_GATEWAY_URL}/api/billing/address`, addressRequestBody, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getAllAddressesApi = async () => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.get(`${BACKEND_API_GATEWAY_URL}/api/billing/address`, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const deleteAddressApi = async (addressId) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.delete(`${BACKEND_API_GATEWAY_URL}/api/billing/address/${addressId}`, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const savePaymentMethodApi = async (cardRequestBody) => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.post(`${BACKEND_API_GATEWAY_URL}/api/payment/paymentMethod`, cardRequestBody, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

export const getAllPaymentMethodsApi = async () => {
  const axiosConfig = getAxiosConfig();
  const responseData = axios.get(`${BACKEND_API_GATEWAY_URL}/api/payment/paymentMethod`, axiosConfig).then((response) => {
    return response.data;
  });
  return responseData;
};

const getAxiosConfig = () => {
  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const accessToken = JSON.parse(localStorage.getItem('userInfo'))?.token;

  if (accessToken) {
    axiosConfig.headers.Authorization = `Bearer ${accessToken}`;
  }
  return axiosConfig;
};
