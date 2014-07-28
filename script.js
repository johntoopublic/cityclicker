(function() {
var format = function(amount, symbol) {
  var amount = Math.floor(amount);
  if (amount > 9999999) {
    amount = amount.toExponential(2);
  }
  return amount + (symbol || '&curren;');
};

var output = function(element, attributes) {
  var html = [];
  for (var k in attributes) {
    html.push(k + ': <b>' + attributes[k] + '</b>');
  }
  element.innerHTML = html.join('<br>');
};

var Zone = function(city, type, symbol, load) {
  load = load || {};
  this.sizes = [];
  var delta = 10;
  for (var i = 1; i <= 10; i++) {
    var label = symbol;
    if (i <= 3) {
      for (var j = 0; j < i - 1; j++) {
        label += symbol;
      }
    } else {
      label += 'x' + i;
    }
    this.sizes.push({
      amount: 0,
      built: 0,
      density: Math.pow(10, .5 * i * i + .5 * i),
      label: label
    });
  }
  this.city = city;
  this.tax = load.tax || 10;
  this.demand = 0;

  var container = document.createElement('div');
  container.className = 'panel ' + type.toLowerCase();
  container.innerHTML = '<h1>' + type + '</h1>';
  for (var i = 0; i < this.sizes.length; i++) {
    var data = this.sizes[i];
    if (load[i]) {
      data.amount = load[i].amount || 0;
      data.built = load[i].built || 0;
    }
    data.button = document.createElement('button');
    data.button.innerHTML = 'Zone ' + data.label;
    data.button.addEventListener('click', this.buy.bind(this, i));
    data.button.style.display = 'none';
    data.status = document.createElement('div');
    data.status.style.display = 'none';
    container.appendChild(data.button);
    container.appendChild(data.status);
  }
  this.city.container.appendChild(container);
  this.city.items.push(this);
};

Zone.prototype.buy = function(size) {
  if (this.city.spend(this.price(size))) {
    this.sizes[size].amount++;
    this.city.update();
  }
};

Zone.prototype.capacity = function() {
  var total = 0;
  for (var i = 0; i < this.sizes.length; i++) {
    total += this.sizes[i].built * this.sizes[i].density;
  }
  return total;
};

Zone.prototype.data = function() {
  var serial = {tax: this.tax}
  for (var i = 0; i < this.sizes.length; i++) {
    serial[i] = {};
    serial[i].amount = this.sizes[i].amount;
    serial[i].built = this.sizes[i].built;
  }
  return serial;
};

Zone.prototype.price = function(size) {
  return Math.floor(this.sizes[size].density *
      Math.pow(1.1, this.sizes[size].amount));
};

Zone.prototype.update = function() {
  var visible = true;
  for (var i = 0; i < this.sizes.length; i++) {
    var data = this.sizes[i];
    var cost = this.price(i);
    output(data.status, {
      Price: format(cost),
      Built: data.built + ' / ' + data.amount,
    });
    this.city.currency += this.tax / 100 * data.built * data.density / 10;
    data.button.disabled = cost > this.city.currency;
    if (data.built < this.demand / data.density && data.built < data.amount) {
      data.built++;
    }
    data.button.style.display = visible ? '' : 'none';
    data.status.style.display = visible ? '' : 'none';
    visible = !!data.amount;
  }
};

var Update = function(city, level, cost, scale, message, levels) {
  this.city = city;
  this.level = level || 0;
  this.cost = cost;
  this.scale = scale || 2;
  this.message = message;
  this.levels = levels || [];
  this.container = document.createElement('div');
  this.container.className = 'update';
  this.button = document.createElement('button');
  this.button.addEventListener('click', this.buy.bind(this));
  this.container.appendChild(this.button);
  this.label = document.createElement('label');
  this.container.appendChild(this.label);
  this.city.updates.appendChild(this.container);
  this.city.items.push(this);
};

Update.prototype.buy = function() {
  if (this.city.spend(this.price())) {
    this.level++;
    this.city.update();
  }
};

Update.prototype.price = function() {
  return this.cost * Math.pow(this.scale, this.level);
};

Update.prototype.update = function() {
  var message = this.levels[this.level] || this.message;
  if (!message) {
    this.container.style.display = 'none';
    return;
  }
  var cost = this.price();
  this.button.innerHTML = format(cost);
  this.button.disabled = cost > this.city.currency;
  this.label.innerHTML = message.replace('CITY', this.city.name);
};

var City = function(data) {
  this.currency = data.currency || 100;
  this.day = data.day || 0;
  this.name = data.name || 'The City';
  this.population = data.population || 0;
  this.status = document.createElement('div');
  this.status.className = 'panel';
  this.container = document.createElement('div');
  this.container.className = 'city';
  this.items = [];
  this.resident = new Zone(this, 'Residential', '&hearts;', data.resident);
  this.commerce = new Zone(this, 'Commercial', '&diams;', data.commerce);
  this.industry = new Zone(this, 'Industrial', '&clubs;', data.industry);
  this.updates = document.createElement('div');
  this.container.appendChild(this.updates);
  this.transport = new Update(this, data.transport, 1000, 2.1,
    'Increase advertising budget.', [
      'Add a road to CITY.',
      'Connect a highway to CITY.',
      'Connect the railway to CITY.',
      'Build a seaport in CITY.',
      'Build a airport in CITY.',
      'Advertise CITY in other cities.',
      'Absorb neighboring city into CITY.',
      'Advertise CITY in other countries.',
      'Build a spaceport in CITY.',
      'Build cloning vats in CITY.',
      'Build a space elevator in CITY.',
      'Attach CITY to teleporter network.',
      'Advertise CITY on other planets.',
      'Advertise CITY in other solar systems.',
      'Advertise CITY to other galaxies.',
    ]);
  this.residentDemand = new Update(this, data.residentDemand, 5000, 1.9,
    'Pay people for moving to CITY.', [
      'Build a school in CITY.',
      'Build a hospital in CITY.',
      'Increase CITY education budget.',
      'Build a college in CITY.',
      'Increase CITY healthcare budget.',
      'Add parks to CITY.',
      'Build a marina in CITY.',
      'Build a zoo in CITY.',
      'Add wildlife to CITY parks.',
      'Build a sports stadium in CITY.',
      'Build a pleasure dome in CITY.',
      'Build a world wonder in CITY.',
      'Embue CITY park wildlife with magic.',
      'Provide free healthcare in CITY.',
      'Move other world wonders to CITY.',
      'Build Fountain of Youth in CITY.',
    ]);
  this.commerceDemand = new Update(this, data.commerceDemand, 10000, 1.8,
    'Give corporations extra votes.', [
      'Put up billboards in CITY.',
      'Build a mall in CITY.',
      'Install CITY monorail to mall.',
      'Legalize gambling in CITY.',
      'Upgrade CITY mall to megamall.',
      'Add giant TVs to all CITY intersections.',
      'Remove liquor restrictions.',
      'Allow anonymously held corporations.',
      'Legalize prositution in CITY.',
      'Turn CITY into mall.',
      'Declare corporations people.',
      'Declare corporations better people.',
      'Legalize all narcotics.',
      'Give corporations CITY keys.',
    ]);
  this.industryDemand = new Update(this, data.industryDemand, 15000, 1.7,
    'Increase robot workforce.', [
      'Build power plant in CITY.',
      'Build a factory in CITY.',
      'Build army base in CITY.',
      'Repeal environmental protections.',
      'Build a mine in CITY.',
      'Automate CITY construction.',
      'Upgrade CITY power plant to fission.',
      'Build worker housing near CITY.',
      'Upgrade CITY mine to strip mine.',
      'Build toxic waste dump in CITY.',
      'Upgrade CITY power plant to fusion.',
      'Remove minimum wage in CITY.',
      'Build CITY robot factories.',
      'Upgrade workers to cyborgs.',
      'Repeal human rights protections.',
      'Nerve staple cyborg workers.',
    ]);
  this.residentTax = new Update(this, data.residentTax, 1000, 2.6,
      'Raise Residential tax.');
  this.commerceTax = new Update(this, data.commerceTax, 1000, 2.4,
      'Raise Commercial tax.');
  this.industryTax = new Update(this, data.industryTax, 1000, 2.2,
      'Raise Industrial tax.');
  this.rename = new Update(this, data.rename, 100, 1.2, 'Rename CITY.');
  this.rename.button.addEventListener('click', function(){
    this.name = prompt('Rename ' + this.name + ' to:');
    this.update();
  }.bind(this));
  this.reset = new Update(this, 0, 0, 1, 'Reset game.');
  this.reset.button.addEventListener('click', function(){
    if (confirm('Are you sure you want to reset the game?')) {
      localStorage.setItem('cityclicker', '');
      location = '';
    }
  }.bind(this));
  this.update();
  this.container.appendChild(this.status);
  document.body.appendChild(this.container);
};

City.prototype.data = function() {
  return {
    currency: this.currency,
    day: this.day,
    name: this.name,
    population: this.population,
    resident: this.resident.data(),
    commerce: this.commerce.data(),
    industry: this.industry.data(),
    transport: this.transport.level,
    residentDemand: this.residentDemand.level,
    commerceDemand: this.commerceDemand.level,
    industryDemand: this.industryDemand.level,
    residentTax: this.residentTax.level,
    commerceTax: this.commerceTax.level,
    industryTax: this.industryTax.level,
    rename: this.rename.level,
  };
};

City.prototype.spend = function(cost) {
  if (cost <= this.currency) {
    this.currency -= cost;
    return true;
  }
};

City.prototype.update = function() {
  var ratio = Math.max(20,
      Math.min(80, 10 + Math.log(this.population) * 4)) / 100;
  this.resident.tax = 10 + this.residentTax.level;
  this.commerce.tax = 15 + this.commerceTax.level;
  this.industry.tax = 12 + this.industryTax.level;
  this.commerce.demand = Math.max(1,
      this.population * Math.max(.1, ratio - this.commerce.tax / 100) *
      Math.pow(1.1, this.commerceDemand.level));
  this.industry.demand = Math.max(1,
      this.population * Math.max(.1, 1 - ratio - this.industry.tax / 100) *
      Math.pow(1.1, this.industryDemand.level));
  this.resident.demand = Math.max(1,
      (this.commerce.demand + this.commerce.capacity() +
       this.industry.demand + this.industry.capacity() / 4) * 
      Math.pow(1.04, this.residentDemand.level));
  this.items.forEach(function(item) {
    item.update();
  });
  if (this.population < this.resident.capacity()) {
    this.population += Math.pow(Math.max(1.01, 2 - this.resident.tax / 100),
        this.transport.level);
  }
  output(this.status, {
    City: this.name,
    Day: this.day,
    Population: format(this.population, '&hearts;'),
    Coffers: format(this.currency),
  });
  localStorage.setItem('cityclicker', btoa(JSON.stringify(this.data())));
};

var load = function() {
  try {
    return JSON.parse(atob(localStorage.getItem('cityclicker')));
  } catch(e) {};
  return {};
};

var data = load();
var city = new City(data);
var time = function() {
  city.update();
  city.day++;
  setTimeout(time, 1000);
};
setTimeout(time, 1000);
})();
