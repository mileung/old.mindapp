mindapp.cc

Client is deployed on Netlify
API is deployed on Fly.io
DB is hosted on Turso

Use a custom domain
https://fly.io/docs/networking/custom-domain/?utm_campaign=first-release&utm_medium=email&utm_source=flyio


# Point-in-Time Recovery
For when you accidentally ruin the db
https://docs.turso.tech/features/point-in-time-recovery

```zsh
$ turso db create mindapp --from-db test --timestamp 2024-05-17T05:07:38.060Z
```

```js
// run this to get lat
const second = 1000;
const delay = 30 * second;
const lastThoughtCreateDate = 1715922428060;
const date = new Date(lastThoughtCreateDate + delay);
const rfc3339Timestamp = date.toISOString();
console.log(rfc3339Timestamp);
```