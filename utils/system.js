const http = require('http');


function OctoPrint(data) {
  this.hostname = hostname;
  Object.assign(this, data); //requires port, apikey


  this.request = (method, path, params = null, headers = null) => {
    var body = '',
        options = {
          method: method,
          hostname: this.hostname,
          port: this.port,
          path: path,
          headers: {'X-Api-Key': this.apikey}
        };
    if (headers) Object.assign(options.headers, headers);

    return new Promise((resolve, reject) => {
      var req = http.request(options, (res) => {
        res.on('data', (d) => {body += d; });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            body: (body.length != 0) ? JSON.parse(body) : null
          });
        });
      });
      req.on('error', reject);
      if (params) req.write(JSON.stringify(params));
      req.end();
    });
  };

  this.get = (path) => { return this.request('GET', path); }
  this.delete = (path, params, headers = null) => { return this.request('DELETE', path, params, headers); }
  this.post = (path, params, headers = null) => { return this.request('POST', path, params, headers); }
  this.patch = (path, params, headers = null) => { return this.request('PATCH', path, params, headers); }




  this.connect = (serialport, profile = null, baud = null) => {
    var params = {
      command: 'connect',
      port: serialport.comName
    };
    if (baud) params.baud = baud;
    if (profile) params.profile = profile;

    this.post('/api/connection', params, {'Content-Type': 'application/json'}).then((res) => {
      if (res.status == 204) {
        this.serialport = serialport;
        console.log(this.port + ' connected to ' + this.serialport.comName);
      }
    });
  }
  this.disconnect = () => {
    var params = {command: 'disconnect'};
    return this.post('/api/connection', params, {'Content-Type': 'application/json'});
  }








  this.file = {
    print: (filename) => {
      var params = {command: 'select', print: true};
      return this.post('/api/files/local/' + filename, params, {'Content-Type' : 'application/json'});
    },
    slice: (filename, options) => {
      var params = {
        command: 'slice',
        slicer: 'cura',
        gcode: filename + '.gcode'
      };
      Object.assign(params, options);

      return this.post('/api/files/local/' + filename, params, {'Content-Type' : 'application/json'});
    },
    info: (filename) => { return this.get('/api/files/local/' + filename); }
  }
  this.job = {
    start: () => { return this.post('/api/job', {command: 'start'}, {'Content-Type': 'application/json'}) },
    cancel: () => { return this.post('/api/job', {command: 'cancel'}, {'Content-Type' : 'application/json'}) },

    pause: () => { return this.post('/api/job', {command: 'pause', action: 'pause'}, {'Content-Type' : 'application/json'}) },
    resume: () => { return this.post('/api/job', {command: 'pause', action: 'resume'}, {'Content-Type' : 'application/json'}) },
    info: () => { return this.get('/api/job') }
  }
  this.printer = {
    info: () => { return this.get('/api/printer?exclude=temperature,sd') },
    setSpeed: (speed) => {
      var params = {
        command: 'feedrate',
        factor: speed
      }
      
      return this.post('/api/printer/printhead', params, {'Content-Type': 'application/json'});
    },
    jog: (x,y,z) => {
      var params = {
        command: 'jog',
        x: x,
        y: y,
        z: z
      };
      return this.post('/api/printer/printhead', params, {'Content-Type': 'application/json'});
    },
    home: (axesString) => {
      var axes = [];
      for (var i = 0; i < axesString.length; i++) axes.push(axesString.charAt(i));
      var params = {
        command: 'home',
        axes: axes
      };
      return this.post('/api/printer/printhead', params, {'Content-Type': 'application/json'});
    },
    tool: (tool) => {
      var params = {
        command: ''
      };
      return this.post('/api/printer/tool', params, {'Content-Type': 'application/json'});
    },
    temp: () => {

    }
  }











  this.wiggle = {
    setTime: (time) => {

      console.log(this.port);
      console.log(this.serialport);



      time *= 1000;
      if (time > this.wiggle.time) this.wiggle.time = time;
      if (!this.wiggle.iswiggling) {
        this.wiggle.wiggle();
        this.wiggle.iswiggling = true;
      }
    },
    stop: () => {
      this.wiggle.time = 0;
      this.wiggle.iswiggling = false;
    },
    wiggle: () => {
      console.log('WIIGGGLLEEE!!');
      this.printer.home('xyz');

      this.wiggle.time -= this.wiggle.delay
      if (this.wiggle.time > 0) setTimeout(this.wiggle.wiggle, this.wiggle.delay);
      else this.wiggle.stop();
    },
    time: 0,
    state: false,
    delay: 1000,
    iswiggling: false
  }








  this.disconnect();
  OctoPrints.push(this);
}

















function Printer(data) {


  //name
  //color
  //status (ready, not ready, in use, unloaded)
  //active

  Object.assign(this, data);

  //set profile to an actual profile, not just a name
  for (var i = 0; i < Profiles.length; i++) if (Profiles[i].id == this.type) { this.Profile = Profiles[i]; break; }


  //progress
  //job
  //server
  //temp = {}

  this.changeColor = () => {}

  this.setHeat = (temp) => {}
  this.setBedHeat = (temp) => {}

  this.moveTool = (data) => {}

  this.attach = (octoprint) => {
    octoprint.Printer = this;
    this.OctoPrint = octoprint;
  }

  this.match = (octoprint) => {
    //determine if octoprint is compatible based on serial port and associated profile info
    return (!this.OctoPrint && true);
  }


  Printers.push(this);
}


function Job(data) {

}
function SlicingProfile(data) {

}


function Profile(data) {
  this.heatedBed = false;
  Object.assign(this, data);
  this.obj = () => {
    return {
      id: this.id,
      name: this.name,
      volume: {
        formFactor: 'rectangular',
        origin: 'lowerleft',
        width: this.volume.x,
        depth: this.volume.y,
        height: this.volume.z,
        custom_box: false
      }
    }
  }
  Profiles.push(this);
}


function newPrinter() {

}
function newProfile() {

}


const hostname = '10.20.30.109';
var ready = false,
    OctoPrints = [],
    Printers = [],
    Profiles = [],
    jobs = [];





module.exports.OctoPrint = OctoPrint;
module.exports.OctoPrints = OctoPrints;
module.exports.Printer = Printer;
module.exports.Printers = Printers;
module.exports.Profile = Profile;
module.exports.Profiles = Profiles;
module.exports.ready = ready;