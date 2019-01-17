import 'babel-polyfill';

const t = async () => {
  const prom = new Promise((res, rej) => {
    setTimeout(() => {
      res('hey');
    }, 5000);
  });

  const msg = await prom;
  document.querySelector('body').innerText = msg;
};

document.querySelector('body').innerText = 'this will change in 5 seconds with async/await';
t();
