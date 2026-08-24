import httpClient from '@/service/httpClient';

// 拿 session 內的使用者
export const sessionUser = () =>{
    httpClient.get('/api/users/now')
    .then(function (response) {
        console.log(response);
        console.log('response.data.loginUsername', response.data.loginUsername);
        return response.data.loginUsername
    })
    .catch(function (error) {
        console.log(error);
        return  error.response.data
     });

}