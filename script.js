(function() {
var teams = ['Hoboken Zephyrs', 'Shelbyville Sharks', 'Santa Destroy Warriors', 'New New York Yankees', 'North Shore High Lions'];
var sports = ['Airball', 'Blernsball', 'Brockian Ultra-Cricket', 'Chess', 'Dungeons & Dungeons', 'Laserball', 'Quidditch'];

var residentMultiplier = 1.05;
var commerceMultiplier = 1.1;
var industryMultiplier = 1.1;

var format = function(amount, symbol) {
  if (amount > 9) {
    amount = Math.floor(amount);
  } else {
    amount = Math.floor(amount * 100) / 100;
  }
  if (amount > 9999999) {
    amount = amount.toExponential(2);
  }
  return amount + (symbol || '&curren;');
};

var formatTime = function(city, cost) {
  var time = Math.max(0, Math.ceil((cost - city.currency) / city.tax));
  return format(time, time == 1 ? ' second' : ' seconds');
}

var output = function(element, attributes, head) {
  var html = [];
  if (head) {
    html.push('<b>' + head + '</b>');
  }
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
  this.type = type;
  this.symbol = symbol;
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
    data.alt = document.createElement('div');
    data.alt.className = 'alt';
    data.status = document.createElement('div');
    data.status.style.display = 'none';
    container.appendChild(data.status);
    container.appendChild(data.button);
    container.appendChild(data.alt);
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

Zone.prototype.income = function(tax) {
  return (tax || this.tax) / 100 * this.capacity() / 10;
}

Zone.prototype.price = function(size) {
  return Math.floor(this.sizes[size].density *
      Math.pow(1.1, this.sizes[size].amount));
};

Zone.prototype.update = function() {
  var visible = true;
  var demand = this.demand;
  for (var i = this.sizes.length - 1; i >= 0; i--) {
    var data = this.sizes[i];
    demand -= data.built * data.density;
  }
  for (var i = 0; i < this.sizes.length; i++) {
    var data = this.sizes[i];
    var cost = this.price(i);
    output(data.status, {
      Price: format(cost),
      Built: data.built + ' / ' + data.amount,
    });
    output(data.alt, {
      'Zone capacity': format(data.density, this.symbol),
      'Current demand': format(this.demand, this.symbol),
      'Total built': format(this.capacity(), this.symbol),
      'Total zoned': format(this.zoned(), this.symbol),
      'Type income': format(this.income()),
      'Time to purchase': formatTime(this.city, cost),
    }, 'Add ' + this.type + ' Zones');
    data.button.disabled = cost > this.city.currency;
    if (demand > 0 && data.built < data.amount) {
      data.built++;
      demand -= data.density;
    }
    data.button.style.display = visible ? '' : 'none';
    data.status.style.display = visible ? '' : 'none';
    visible = !!data.amount;
  }
};

Zone.prototype.zoned = function() {
  var total = 0;
  for (var i = 0; i < this.sizes.length; i++) {
    total += this.sizes[i].amount * this.sizes[i].density;
  }
  return total;
};

var Update = function(city, level, cost, scale, message, levels, stats) {
  this.city = city;
  this.level = level || 0;
  this.cost = cost;
  this.scale = scale || 2;
  this.message = message;
  this.levels = levels || [];
  this.stats = stats;
  this.container = document.createElement('div');
  this.container.className = 'update';
  this.button = document.createElement('button');
  this.button.addEventListener('click', this.buy.bind(this));
  this.container.appendChild(this.button);
  this.alt = document.createElement('div');
  this.alt.className = 'alt';
  this.container.appendChild(this.alt);
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
  } else if (typeof(message) == 'function') {
    message = message(this);
  }
  var cost = this.price();
  if (this.stats) {
    this.stats();
  } else {
    output(this.alt, {
      'Time to purchase': formatTime(this.city, cost),
    }, this.title);
  }
  this.button.innerHTML = format(cost);
  this.button.disabled = cost > this.city.currency;
  this.label.innerHTML = message.replace('CITY', '<b>' + this.city.name + '</b>');
};

var City = function(data) {
  this.currency = data.currency || 100;
  this.day = data.day || 0;
  this.name = data.name || 'The City';
  this.population = data.population || 0;
  this.tax = 0;
  this.container = document.createElement('div');
  this.container.className = 'city';
  this.status = document.createElement('div');
  this.status.className = 'status';
  this.container.appendChild(this.status);
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
      'Build an airport in CITY.',
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
    ], function() {
      var multiplier = Math.max(1.01, 2 - this.city.resident.tax / 100);
      output(this.alt, {
        Multiplier: format(multiplier, '&times;'),
        'Current rate': format(Math.pow(multiplier, this.level), '&hearts; per second'),
        'Upgrade rate': format(Math.pow(multiplier, this.level + 1), '&hearts; per second'),
        'Time to purchase': formatTime(this.city, this.price()),
      }, 'Gain population faster');
    });
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
    ], function() {
      output(this.alt, {
        Multiplier: format(residentMultiplier, '&times;'),
        'Current demand': format(this.city.resident.demand, '&hearts;'),
        'Upgrade demand': format(this.city.resident.demand * residentMultiplier, '&hearts;'),
        'Time to purchase': formatTime(this.city, this.price()),
      }, 'Increase residential demand');
    });
  this.commerceDemand = new Update(this, data.commerceDemand, 5000, 1.8,
    'Give corporations extra votes.', [
      'Put up billboards in CITY.',
      'Build a mall in CITY.',
      'Build direct CITY monorail to mall.',
      'Legalize gambling in CITY.',
      'Upgrade CITY Mall to CITY Megamall.',
      'Add giant TVs to all CITY intersections.',
      'Remove liquor restrictions.',
      'Allow anonymously held corporations.',
      'Legalize prositution in CITY.',
      'Turn CITY into mall.',
      'Declare corporations people.',
      'Declare corporations better people.',
      'Legalize all narcotics.',
      'Give corporations CITY keys.',
    ], function() {
      output(this.alt, {
        Multiplier: format(commerceMultiplier, '&times;'),
        'Current demand': format(this.city.commerce.demand, '&diams;'),
        'Upgrade demand': format(this.city.commerce.demand * commerceMultiplier, '&diams;'),
        'Time to purchase': formatTime(this.city, this.price()),
      }, 'Increase commercial demand');
    });
  this.industryDemand = new Update(this, data.industryDemand, 10000, 1.7,
    'Increase robot workforce.', [
      'Build a power plant in CITY.',
      'Build a factory in CITY.',
      'Build an army base in CITY.',
      'Repeal environmental protections.',
      'Build a mine in CITY.',
      'Automate CITY construction.',
      'Upgrade CITY Power Plant to fission.',
      'Build worker housing near CITY.',
      'Upgrade CITY mine to strip mine.',
      'Build toxic waste dump in CITY.',
      'Upgrade CITY Power Plant to fusion.',
      'Remove minimum wage in CITY.',
      'Build CITY robot factories.',
      'Upgrade workers to cyborgs.',
      'Repeal human rights protections.',
      'Nerve staple cyborg workers.',
    ], function() {
      output(this.alt, {
        Multiplier: format(industryMultiplier, '&times;'),
        'Current demand': format(this.city.industry.demand, '&clubs;'),
        'Upgrade demand': format(this.city.industry.demand * industryMultiplier, '&clubs;'),
        'Time to purchase': formatTime(this.city, this.price()),
      }, 'Increase industrial demand');
    });
  this.residentTax = new Update(this, data.residentTax, 1000, 2.6, function() {
    return 'Raise Residential tax (<b>' + this.resident.tax + '</b>%).'}.bind(this), [],
    function() {
      output(this.alt, {
        'New Rate': this.city.resident.tax + 1 + '%',
        'Current income': format(this.city.resident.income()),
        'Upgrade income': format(this.city.resident.income(this.city.resident.tax + 1)),
        'Time to purchase': formatTime(this.city, this.price()),
      }, 'Raise residential taxes');
    });
  this.commerceTax = new Update(this, data.commerceTax, 1000, 2.4, function() {
    return 'Raise Commercial tax (<b>' + this.commerce.tax + '</b>%).'}.bind(this), [],
    function() {
      output(this.alt, {
        'New Rate': this.city.commerce.tax + 1 + '%',
        'Current income': format(this.city.commerce.income()),
        'Upgrade income': format(this.city.commerce.income(this.city.commerce.tax + 1)),
        'Time to purchase': formatTime(this.city, this.price()),
      }, 'Raise commercial taxes');
    });
  this.industryTax = new Update(this, data.industryTax, 1000, 2.2, function() {
    return 'Raise Industrial tax (<b>' + this.industry.tax + '</b>%).'}.bind(this), [],
    function() {
      output(this.alt, {
        'New Rate': this.city.industry.tax + 1 + '%',
        'Current income': format(this.city.industry.income()),
        'Upgrade income': format(this.city.industry.income(this.city.industry.tax + 1)),
        'Time to purchase': formatTime(this.city, this.price()),
      }, 'Raise industrial taxes');
    });
  this.rename = new Update(this, data.rename, 1000, 1.2, 'Rename CITY.');
  this.rename.button.addEventListener('click', function(){
    this.name = prompt('Rename ' + this.name + ' to:');
    this.update();
  }.bind(this));
  this.reset = new Update(this, 0, 0, 1, 'Reset game.');
  this.reset.button.addEventListener('click', function(){
    if (confirm('Are you sure you want to reset the game?')) {
      localStorage.setItem('cityclicker', '');
      document.body.removeChild(this.container);
      city = new City({});
    }
  }.bind(this));
  this.news = new Update(this, data.news, 1, 1.07, function() {
    if (this.population > 1e16) {
      return 'Receive CITY thought broadcast.';
    } else if (this.population > 1e12) {
      return 'Check CITY app.';
    } else if (this.population > 1e8) {
      return 'Watch CITY news.';
    } else if (this.population > 1e4) {
      return 'Check CITY website.';
    } else {
      return 'Read CITY Times.';
    }
  }.bind(this));
  this.news.button.addEventListener('click', this.report.bind(this));
  this.newspaper = document.createElement('div');
  this.newspaper.className = 'newspaper';
  this.container.appendChild(this.newspaper);
  this.update();
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
    news: this.news.level,
  };
};

City.prototype.date = function() {
  return new Date(this.day * 24 * 60 * 60 * 1000).toDateString();
}

City.prototype.report = function() {
  var update = document.createElement('div');
  var close = document.createElement('div');
  close.innerHTML = '<b>&times</b>';
  close.className = 'close';
  close.addEventListener('click', function() {
    this.newspaper.removeChild(update);
  }.bind(this));
  update.appendChild(close);
  var text = document.createElement('div');
  var resident = this.resident.demand / this.resident.capacity();
  var html = '<b class="date">' + this.date() + '</b>';
  html += '<h1>' + this.name + ' News</h1>';
  html += '<h3>Opinion</h3>';
  if (resident >= 1) {
    var demand = this.transport.label.innerHTML;
    html += 'Housing is currently in demand! Why won\'t the mayor zone some more residential';
    if (this.residentTax.price() < this.currency) {
      html += ' or raise that tax rate of ' + this.resident.tax + '%';
    }
    html += '? While on the subject of getting more citizens into the city, the proposal to <u>' + demand[0].toLowerCase() + demand.slice(1, demand.length - 1) + '</u> would likely help fill those built houses faster in the future.';
  } else {
    var demand = this.residentDemand.label.innerHTML;
    html += 'Zoned residential is currently being unused. Has the mayor considered the proposal to <u>' + demand[0].toLowerCase() + demand.slice(1, demand.length - 1) + '</u> to encourage people to move in?';
  }
  html += '<br><br>';
  var commerce = this.commerce.demand / this.commerce.capacity();
  if (commerce >= 1) {
    html += resident >= 1 ? 'Like' : 'Unlike';
    html += ' residential, businesses want to set up shop! Now\'s the time to ';
    if (this.commerceTax.price() < this.currency) {
      html += 'either bump up that tax rate of ' + this.commerce.tax + '% or ';
    }
    html += 'add more commercial zones.';
  } else {
    var demand = this.commerceDemand.label.innerHTML;
    html += resident >= 1 ? 'Unlike' : 'Like';
    html += ' residential, zoned commercial still lies empty. When will the mayor <u>' + demand[0].toLowerCase() + demand.slice(1, demand.length - 1) + '</u> so businesses can function here?';
  }
  html += '<br><br>';
  var industry = this.industry.demand / this.industry.capacity();
  if (industry >= 1) {
    html += 'Finally, why isn\'t the mayor expanding industry?';
    if (this.industryTax.price() < this.currency) {
      html += ' Is the mayor just going to increase the ' + this.industry.tax + '% taxes since there\'s not enough zones to meet demand? Harsh.';
    }
  } else {
    var demand = this.industryDemand.label.innerHTML;
    html += 'For reasons unclear to this reporter, the mayor seems to be considering whether to <u>' + demand[0].toLowerCase() + demand.slice(1, demand.length - 1) + '</u> to entice industry into the city. While high industrial and commercial demand drive up residential demand, one wonders if there is a better way.';
  }
  html += '<h3>Sports</h3>';
  if (this.population == 0) {
    html += this.name + ' doesn\'t yet have a sports time, as no one lives here yet.';
  } else {
    var us = Math.floor(Math.random() * 20);
    var them = Math.floor(Math.random() * 20);
    var team = teams[Math.floor(Math.random() * teams.length)];
    var sport = sports[Math.floor(Math.random() * sports.length)];
    if (us > them) {
      html += 'Local sports team the <b>' + this.name + ' Llamas</b> handily defeated rival team the <b>' + team + '</b> <b>' + us + '</b> to <b>' + them + '</b> in <b>' + sport + '</b>. Go team!';
    } else if (us < them) {
      html += 'Local sports team the <b>' + this.name + ' Llamas</b> suffered a crushing defeat against rival team the <b>' + team + '</b>. The ' + sport + ' game ended with the Llamas down by <b>' + (them - us) + '</b>.';
      if (them - us > 10) {
        html += ' It was indeed a dark day for ' + this.name + '.';
      }
    } else {
      html += 'After a long and well played ' + sport + ' match, local sports team the <b>' + this.name + ' Llamas</b> tied rival team the <b>' + team + '</b>. The <b>' + us + '</b> to <b>' + them + '</b> game will surely go down as one of the best in the history of the sport.';
    }
  }
  text.innerHTML = html;
  update.appendChild(text);
  if (this.newspaper.firstChild) {
    this.newspaper.insertBefore(update, this.newspaper.firstChild);
  } else {
    this.newspaper.appendChild(update);
  }
}

City.prototype.spend = function(cost) {
  if (cost <= this.currency) {
    this.currency -= cost;
    return true;
  }
};

City.prototype.update = function(write) {
  var ratio = Math.max(20,
      Math.min(80, 10 + Math.log(this.population) * 4)) / 100;
  this.resident.tax = 10 + this.residentTax.level;
  this.commerce.tax = 15 + this.commerceTax.level;
  this.industry.tax = 12 + this.industryTax.level;
  this.commerce.demand = 1.1 * Math.max(1,
      this.population * Math.max(.1, ratio - this.commerce.tax / 100) *
      Math.pow(commerceMultiplier, this.commerceDemand.level));
  this.industry.demand = 1.1 * Math.max(1,
      this.population * Math.max(.1, 1 - ratio - this.industry.tax / 100) *
      Math.pow(industryMultiplier, this.industryDemand.level));
  this.resident.demand = Math.max(1,
      Math.max(.1, 1 - this.resident.tax / 100) *
      (this.commerce.demand + this.commerce.capacity() +
       this.industry.demand + this.industry.capacity() / 4) *
      Math.pow(residentMultiplier, this.residentDemand.level));
  this.items.forEach(function(item) {
    item.update();
  });
  this.tax = this.resident.income() + this.commerce.income() + this.industry.income();
  if (write) {
    this.currency += this.tax;
    if (this.population < this.resident.capacity()) {
      this.population += Math.pow(Math.max(1.01, 2 - this.resident.tax / 100),
          this.transport.level);
    }
  }
  output(this.status, {
    City: this.name,
    Population: format(this.population, '&hearts;'),
    Treasury: format(this.currency),
    'Daily Income': format(this.tax),
  }, this.date());
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
  var start = new Date();
  city.update(true);
  city.day++;
  setTimeout(time, Math.max(1000 - (new Date() - start), 100));
};
setTimeout(time, 1000);
})();
