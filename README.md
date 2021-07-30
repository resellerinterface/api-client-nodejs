# api-client-nodejs


## Installation

```bash
npm i @resellerinterface/api-client-nodejs
```

## Example
```js
const apiclient = require('@resellerinterface/api-client-nodejs');

// create a new client
const client = new apiclient();

// login
await client.login("username", "password", 1234)

// make a request
const response = await client.request("reseller/details", {resellerID: 'own'}, "RESPONSE_RESPONSE");
console.log(response.getData());
// response
// {
//     "time": 12,
//     "state": 1000,
//     "stateName": "OK",
//     "stateParam": "",
//     "reseller": {
//     "resellerID": 23456,
//         "parentID": 23455,
//         "state": "ACTIVE",
//         "company": "Acme Corp.",
//         "firstname": "John",
//         "lastname": "Doe",
//         "street": "Mainstreet",
//         "number": "1223",
//         "postcode": "10115",
//         "city": "Berlin",
//         "country": "DE",
//         "mail": "info@example.org",
//         "phone": "+491234567890",
//         "fax": "",
//         "parents": [
//         23455
//     ],
//         "settings": {
//         "group": {
//             "name": "value"
//         }
//     }
// },
//     "user": {
//     "userID": 12345,
//         "state": "ACTIVE",
//         "username": "User",
//         "password": "****",
//         "settings": {
//         "group": {
//             "name": "value"
//         }
//     },
//     "rightsCategory": 51,
//         "rightsGroups": [
//         912,
//         913
//     ],
//         "directRights": {
//         "category": {
//             "group": {
//                 "function": true
//             }
//         }
//     },
//     "rights": {
//         "category": {
//             "group": {
//                 "function": true
//             }
//         }
//     }
// }
// }
```