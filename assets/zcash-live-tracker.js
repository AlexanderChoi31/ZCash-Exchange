(function () {
  function formatNumber(value, options) {
    if (isNaN(value)) return '--';
    try {
      return new Intl.NumberFormat(undefined, options).format(value);
    } catch (e) {
      return value;
    }
  }

  function initTracker(section) {
    var currency = (section.getAttribute('data-currency') || 'usd').toLowerCase();
    var refreshSeconds = parseInt(section.getAttribute('data-interval') || '30', 10);
    var provider = section.getAttribute('data-provider') || 'coingecko';
    var statusEl = section.querySelector('[data-tracker-status]');
    var priceEl = section.querySelector('[data-tracker-field="price"]');
    var changeEl = section.querySelector('[data-tracker-field="change"]');
    var highEl = section.querySelector('[data-tracker-field="high"]');
    var lowEl = section.querySelector('[data-tracker-field="low"]');
    var updatedEl = section.querySelector('[data-tracker-field="updated"]');
    var dotEl = section.querySelector('[data-tracker-dot]');

    if (!priceEl) return;

    var endpoints = {
      coingecko:
        'https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=' +
        currency +
        '&include_24hr_change=true&include_last_updated_at=true'
    };

    function setStatus(message, isError) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.dataset.state = isError ? 'error' : 'ok';
    }

    function updateUI(payload) {
      var price = payload.price;
      var change = payload.change;
      var updated = payload.updated;

      priceEl.textContent = formatNumber(price, {
        style: 'currency',
        currency: currency.toUpperCase()
      });

      if (changeEl) {
        var prefix = change > 0 ? '+' : '';
        changeEl.textContent = prefix + formatNumber(change, { maximumFractionDigits: 2 }) + '%';
        changeEl.dataset.direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
      }

      if (highEl && payload.high) {
        highEl.textContent = formatNumber(payload.high, {
          style: 'currency',
          currency: currency.toUpperCase()
        });
      }
      if (lowEl && payload.low) {
        lowEl.textContent = formatNumber(payload.low, {
          style: 'currency',
          currency: currency.toUpperCase()
        });
      }
      if (updatedEl && updated) {
        var date = new Date(updated * 1000);
        updatedEl.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    function fetchData() {
      setStatus('Refreshing…', false);
      fetch(endpoints[provider])
        .then(function (response) {
          if (!response.ok) throw new Error('Network error');
          return response.json();
        })
        .then(function (data) {
          var payload = {
            price: data.zcash ? data.zcash[currency] : undefined,
            change: data.zcash ? data.zcash[currency + '_24h_change'] : undefined,
            updated: data.zcash ? data.zcash.last_updated_at : undefined
          };
          updateUI(payload);
          setStatus('Live · ' + currency.toUpperCase(), false);
        })
        .catch(function () {
          setStatus('Failed to refresh', true);
        });
    }

    fetchData();
    setInterval(fetchData, Math.max(10, refreshSeconds) * 1000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sections = document.querySelectorAll('[data-zcash-tracker]');
    sections.forEach(initTracker);
  });
})();
