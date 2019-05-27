import Widget from './widget';

const parent = document.querySelector('[data-id=widgetHolder]');
const widget = new Widget(parent);
widget.create();


const servers = [
  {
    id: '123',
    state: 'created',
  },
  {
    id: '912',
    state: 'created',
  },
];

servers[0].state = 'done';

servers.findIndex(x => x.id === '123'); // найти индекс по id
