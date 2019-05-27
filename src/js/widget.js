export default class Widget {
  constructor(parent) {
    this.parent = parent;
    this.ws = new WebSocket('ws://eleven-three.herokuapp.com/ws');
    this.ws.binaryType = 'blob'; // arraybuffer
  }

  create() {
    this.createControlPanel();
    this.createWorklog();
    this.addLinkListener();

    this.addEventListeners();
  }

  createControlPanel() {
    const divEl = document.createElement('div');
    divEl.className = 'controlPanel';
    divEl.setAttribute('data-id', 'controlPanel');
    divEl.innerHTML = `
      <h3 class="panelTitle">Your micro instances:</h3>
      <a href="#" data-id="createNewInstance">Create new instance</a>`;

    this.parent.appendChild(divEl);
  }

  createWorklog() {
    const divEl = document.createElement('div');
    divEl.className = 'worklog';
    divEl.setAttribute('data-id', 'worklog');
    divEl.innerHTML = '<h3 class="panelTitle">Worklog:</h3>';

    this.parent.appendChild(divEl);
  }

  addLinkListener() {
    this.createNewInstance = this.parent.querySelector('[data-id=createNewInstance]');
    this.createNewInstance.addEventListener('click', (event) => {
      event.preventDefault();
      console.log('Новая зависимость (надо делать сервер)');

      this.ws.send(['createNewInstance']);
    });
  }

  addEventListeners() {
    this.ws.addEventListener('open', () => {
      console.log('connected');
      this.ws.send(['getHistory']);
    });

    this.ws.addEventListener('close', (evt) => {
      console.log('connection closed', evt);
    });

    this.ws.addEventListener('error', (event) => {
      console.log('error');
      console.log(event);
    });

    this.ws.addEventListener('message', (evt) => {
      console.info(evt.data);
      this.messagesArr = this.splitString(evt.data);
      console.info(this.messagesArr);

      if (this.messagesArr[0].toString() === 'true') {
        console.log('Ответ с сервера получен, идёт создание сервера');
        this.makeLog(this.messagesArr[1], this.messagesArr[2], this.messagesArr[3]);
      } else if (this.messagesArr[0].toString() === 'created') {
        console.log('Сервер готов, можно создать упр панель');
        this.makeLog(this.messagesArr[1], this.messagesArr[2], this.messagesArr[3]);
        this.createControlMenu(this.messagesArr[1]);
      } else if (this.messagesArr[0].toString() === 'started') {
        console.log('Сервер запущен');
        this.makeLog(this.messagesArr[1], this.messagesArr[2], this.messagesArr[3]);
        // меняем play
        this.changeStatus(this.messagesArr[1], 'play');
      } else if (this.messagesArr[0].toString() === 'paused') {
        console.log('Сервер приостановлен');
        this.makeLog(this.messagesArr[1], this.messagesArr[2], this.messagesArr[3]);
        // меняем pause
        this.changeStatus(this.messagesArr[1], 'pause');
      } else if (this.messagesArr[0].toString() === 'removed') {
        console.log('Сервер удалён');
        this.makeLog(this.messagesArr[1], this.messagesArr[2], this.messagesArr[3]);
        // удаляем панель управления
        this.changeStatus(this.messagesArr[1], 'remove');
      } else if (this.messagesArr[0].toString() === 'giveHistory') {
        console.log('Получили список серверов');
        console.log(this.messagesArr);
        this.createControlMenu(this.messagesArr, this.messagesArr.length);
        console.log(this.messagesArr[2]);
      } else {
        console.log('Сервер получил новую команду');
        this.makeLog(this.messagesArr[1], this.messagesArr[2], this.messagesArr[3]);
      }
    });
  }

  changeStatus(serverId, command) {
    const serverStatus = this.parent.querySelector(`[data-id=status_${serverId}]`);
    const serverPlayBtn = this.parent.querySelector(`[data-id=play_${serverId}]`);
    const serverPauseBtn = this.parent.querySelector(`[data-id=pause_${serverId}]`);
    const serverCtrBlock = this.parent.querySelector(`[data-id=serCtr_${serverId}]`);

    if (command === 'play') {
      serverStatus.className = 'statusRun';
      serverStatus.textContent = 'Running';
      serverPlayBtn.classList.add('invisible');
      serverPauseBtn.classList.remove('invisible');
    } else if (command === 'pause') {
      serverStatus.className = 'statusStop';
      serverStatus.textContent = 'Stopped';
      serverPauseBtn.classList.add('invisible');
      serverPlayBtn.classList.remove('invisible');
    } else if (command === 'remove') {
      serverCtrBlock.remove();
    }
  }

  makeLog(serverId, logText, timeNow) {
    const divEl = document.createElement('div');
    divEl.className = 'dataHolder';
    divEl.innerHTML = `<div class="dateHolder">
      <span class="date">${timeNow}</span>
    </div>
    <div class="status">
      <span class="title">Server:</span>
      <span class="serverId">${serverId}</span>
    </div>
    <div class="actions">
      <span class="title">Info:</span>
      <span class="serverInfo">${logText}</span>
    </div>`;

    const worklog = this.parent.querySelector('[data-id=worklog]');
    worklog.appendChild(divEl);
  }

  createControlMenu(serverId, count) {
    if (!count) {
      const divEl = document.createElement('div');
      divEl.className = 'instanceHolder';
      divEl.setAttribute('data-id', `serCtr_${serverId}`);
      divEl.innerHTML = `
      <span class="serverId">${serverId}</span>
      <div class="status">
        <span class="title">Status:</span>
        <span data-id="status_${serverId}" class="statusStop">Stopped</span>
      </div>
      <div class="actions">
        <span class="title">Actions:</span>
        <span data-id="play_${serverId}" class="play"></span>
        <span data-id="pause_${serverId}" class="pause invisible"></span>
        <span data-id="remove_${serverId}" class="remove"></span>
      </div>`;

      const controlPanel = this.parent.querySelector('[data-id=controlPanel]');
      // добавляет перед "меню"  this.createNewInstance
      controlPanel.insertBefore(divEl, this.createNewInstance);

      this.addEventsListeners(serverId);
    } else {
      for (let i = 1; i < count; i += 2) {
        const statusClass = [];
        const styleArr = [];
        if (serverId[i + 1].toString() === 'started') {
          statusClass[0] = 'statusRun';
          statusClass[1] = 'Started';
          styleArr[0] = 'invisible';
          styleArr[1] = '';
        } else {
          statusClass[0] = 'statusStop';
          statusClass[1] = 'Stopped';
          styleArr[0] = '';
          styleArr[1] = 'invisible';
        }
        const divEl = document.createElement('div');
        divEl.className = 'instanceHolder';
        divEl.setAttribute('data-id', `serCtr_${serverId[i]}`);
        divEl.innerHTML = `
        <span class="serverId">${serverId[i]}</span>
        <div class="status">
          <span class="title">Status:</span>
          <span data-id="status_${serverId[i]}" class="${statusClass[0]}">${statusClass[1]}</span>
        </div>
        <div class="actions">
          <span class="title">Actions:</span>
          <span data-id="play_${serverId[i]}" class="play ${styleArr[0]}"></span>
          <span data-id="pause_${serverId[i]}" class="pause ${styleArr[1]}"></span>
          <span data-id="remove_${serverId[i]}" class="remove"></span>
        </div>`;

        const controlPanel = this.parent.querySelector('[data-id=controlPanel]');
        // добавляет перед "меню"  this.createNewInstance
        controlPanel.insertBefore(divEl, this.createNewInstance);

        this.addEventsListeners(serverId[i]);
      }
    }
  }

  addEventsListeners(serverId) {
    // const serverStatus = this.parent.querySelector(`[data-id=status_${serverId}]`);
    const serverPlayBtn = this.parent.querySelector(`[data-id=play_${serverId}]`);
    const serverPauseBtn = this.parent.querySelector(`[data-id=pause_${serverId}]`);
    const serverRemoveBtn = this.parent.querySelector(`[data-id=remove_${serverId}]`);

    serverPlayBtn.addEventListener('click', () => {
      // получаем id сервера о котором идёт речь
      const localId = this.splitStringSmall(serverPlayBtn.getAttribute('data-id'));
      this.ws.send(['start', localId[1]]);
    });

    serverPauseBtn.addEventListener('click', () => {
      // получаем id сервера о котором идёт речь
      const localId = this.splitStringSmall(serverPlayBtn.getAttribute('data-id'));
      this.ws.send(['pause', localId[1]]);
    });

    serverRemoveBtn.addEventListener('click', () => {
      // получаем id сервера о котором идёт речь
      const localId = this.splitStringSmall(serverPlayBtn.getAttribute('data-id'));
      this.ws.send(['remove', localId[1]]);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  splitString(stringToSplit) {
    const arrayOfStrings = stringToSplit.split(',');
    const arrayOfStringsFinal = [];
    for (let i = 0; i < arrayOfStrings.length; i += 1) {
      arrayOfStringsFinal.push(arrayOfStrings[i].split('|+|'));
    }
    return arrayOfStringsFinal;
  }

  // eslint-disable-next-line class-methods-use-this
  splitStringSmall(stringToSplit) {
    const arrayOfStrings = stringToSplit.split('_');
    return arrayOfStrings;
  }
}
