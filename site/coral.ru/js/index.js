var log, queryParam, trouble,
  slice = [].slice;

window.ASAP = (function() {
  var callall, fns;
  fns = [];
  callall = function() {
    var f, results;
    results = [];
    while (f = fns.shift()) {
      results.push(f());
    }
    return results;
  };
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callall, false);
    window.addEventListener('load', callall, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', callall);
    window.attachEvent('onload', callall);
  }
  return function(fn) {
    fns.push(fn);
    if (document.readyState === 'complete') {
      return callall();
    }
  };
})();

log = function() {
  if (window.console && window.DEBUG) {
    if (typeof console.group === "function") {
      console.group(window.DEBUG);
    }
    if (arguments.length === 1 && Array.isArray(arguments[0]) && console.table) {
      console.table.apply(window, arguments);
    } else {
      console.log.apply(window, arguments);
    }
    return typeof console.groupEnd === "function" ? console.groupEnd() : void 0;
  }
};

trouble = function() {
  var ref;
  if (window.console) {
    if (window.DEBUG) {
      if (typeof console.group === "function") {
        console.group(window.DEBUG);
      }
    }
    if ((ref = console.warn) != null) {
      ref.apply(window, arguments);
    }
    if (window.DEBUG) {
      return typeof console.groupEnd === "function" ? console.groupEnd() : void 0;
    }
  }
};

window.preload = function(what, fn) {
  var lib;
  if (!Array.isArray(what)) {
    what = [what];
  }
  return $.when.apply($, (function() {
    var i, len1, results;
    results = [];
    for (i = 0, len1 = what.length; i < len1; i++) {
      lib = what[i];
      results.push($.ajax(lib, {
        dataType: 'script',
        cache: true
      }));
    }
    return results;
  })()).done(function() {
    return typeof fn === "function" ? fn() : void 0;
  });
};

window.queryParam = queryParam = function(p, nocase) {
  var k, params, params_kv;
  params_kv = location.search.substr(1).split('&');
  params = {};
  params_kv.forEach(function(kv) {
    var k_v;
    k_v = kv.split('=');
    return params[k_v[0]] = k_v[1] || '';
  });
  if (p) {
    if (nocase) {
      for (k in params) {
        if (k.toUpperCase() === p.toUpperCase()) {
          return decodeURIComponent(params[k]);
        }
      }
      return void 0;
    } else {
      return decodeURIComponent(params[p]);
    }
  }
  return params;
};

String.prototype.zeroPad = function(len, c) {
  var s;
  s = '';
  c || (c = '0');
  len || (len = 2);
  len -= this.length;
  while (s.length < len) {
    s += c;
  }
  return s + this;
};

Number.prototype.zeroPad = function(len, c) {
  return String(this).zeroPad(len, c);
};

Number.prototype.pluralForm = function(root, suffix_list) {
  return root + (this >= 11 && this <= 14 ? suffix_list[0] : suffix_list[this % 10]);
};

Number.prototype.asDays = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('д', ['ней', 'ень', 'ня', 'ня', 'ня', 'ней', 'ней', 'ней', 'ней', 'ней']);
};

Number.prototype.asHours = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('час', ['ов', '', 'а', 'а', 'а', 'ов', 'ов', 'ов', 'ов', 'ов']);
};

Number.prototype.asMinutes = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('минут', ['', 'а', 'ы', 'ы', 'ы', '', '', '', '', '']);
};

Number.prototype.asSeconds = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('секунд', ['', 'а', 'ы', 'ы', 'ы', '', '', '', '', '']);
};

ASAP(function() {
  return (function($, window) {
    var Flipdown;
    return Flipdown = (function() {
      Flipdown.prototype.defaults = {
        momentX: moment().add({
          d: 2
        }),
        labels: true,
        overMessage: ''
      };

      function Flipdown(el, options) {
        this.options = $.extend({}, this.defaults, options);
        this.$el = $(el);
        this.server_moment = moment();
        this.time_gap = moment.duration(0);
        this.init();
      }

      Flipdown.prototype.init = function() {
        $.ajax('/', {
          method: 'HEAD'
        }).then((function(_this) {
          return function(a, b, c) {
            _this.server_moment = moment(c.getResponseHeader('Date'));
            return _this.time_gap = moment.duration(_this.server_moment.diff(moment()));
          };
        })(this));
        return this;
      };

      Flipdown.prototype.tick = function() {
        var remains;
        remains = moment.duration(this.options.momentX.diff(moment())).add(this.time_gap);
        if (remains.asSeconds() <= 0) {
          this.over();
          return this;
        }
        this.render(remains).then((function(_this) {
          return function() {
            return _this.rafh = requestAnimationFrame(function() {
              return _this.tick();
            });
          };
        })(this));
        return this;
      };

      Flipdown.prototype.start = function() {
        this.rafh = requestAnimationFrame((function(_this) {
          return function() {
            return _this.tick();
          };
        })(this));
        return this;
      };

      Flipdown.prototype.stop = function() {
        if (this.rafh) {
          cancelAnimationFrame(this.rafh);
        }
        return this;
      };

      Flipdown.prototype.over = function() {
        var msg_letters, pad;
        this.stop();
        if (this.options.overMessage) {
          msg_letters = this.options.overMessage.split('');
          pad = 8 - msg_letters.length;
          while (pad--) {
            msg_letters.unshift(' ');
          }
          this.render({
            days: function() {
              return (msg_letters[0] || ' ') + (msg_letters[1] || ' ');
            },
            hours: function() {
              return (msg_letters[2] || ' ') + (msg_letters[3] || ' ');
            },
            minutes: function() {
              return (msg_letters[4] || ' ') + (msg_letters[5] || ' ');
            },
            seconds: function() {
              return (msg_letters[6] || ' ') + (msg_letters[7] || ' ');
            }
          }).then((function(_this) {
            return function() {
              return _this.$el.trigger('time-is-up');
            };
          })(this));
          this.$el.find('.label').css({
            visibility: 'hidden'
          });
        } else {
          this.$el.trigger('time-is-up');
        }
        return this;
      };

      Flipdown.prototype.render = function(remains) {
        var hit_non_zero_rank, promise;
        hit_non_zero_rank = false;
        promise = $.Deferred();
        this.$el.find('[data-units]').each((function(_this) {
          return function(idx, el) {
            var $stacks, $units, digits2set, units, value, value2set;
            $units = $(el);
            units = $units.attr('data-units');
            value = Number($units.attr('data-value'));
            value2set = remains[units]();
            hit_non_zero_rank || (hit_non_zero_rank = value2set !== 0);
            if (!hit_non_zero_rank) {
              $units.addClass('insignificant');
            }
            if (value2set !== value) {
              $units.attr('data-value', value2set);
              digits2set = value2set.zeroPad(2);
              $stacks = $units.find('.flipper-stack');
              $.when(_this.flipStack2($stacks.eq(0), digits2set[0]), _this.flipStack2($stacks.eq(1), digits2set[1])).then(function() {
                return promise.resolve();
              });
              try {
                if (_this.options.labels) {
                  return $units.find('.label').text(value2set[{
                    days: 'asDays',
                    hours: 'asHours',
                    minutes: 'asMinutes',
                    seconds: 'asSeconds'
                  }[units]]());
                }
              } catch (error) {}
            } else {
              return promise.resolve();
            }
          };
        })(this));
        return promise;
      };

      Flipdown.prototype.flipStack2 = function(stack_el, n) {
        var $last_flipper, $new_flipper, $recent_flippers, $stack_el, promise;
        $stack_el = $(stack_el);
        promise = $.Deferred();
        $recent_flippers = $stack_el.children();
        $last_flipper = $recent_flippers.eq(-1);
        if ($last_flipper.attr('data-digit') !== String(n)) {
          $new_flipper = $("<div class='flipper flip-in' data-digit='" + n + "'></div>");
          $stack_el.append($new_flipper);
          $last_flipper.addClass('flip-out');
          setTimeout(function() {
            return $new_flipper.one('transitionend transitioncancel', function() {
              $recent_flippers.remove();
              return promise.resolve();
            }).removeClass('flip-in');
          }, 0);
        } else {
          promise.resolve();
        }
        return promise;
      };

      $.fn.extend({
        Flipdown: function() {
          var args, option;
          option = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          return this.each(function() {
            var $this, data;
            $this = $(this);
            data = $this.data('Flipdown');
            if (!data) {
              $this.data('Flipdown', (data = new Flipdown(this, option)));
            }
            if (typeof option === 'string') {
              return data[option].apply(data, args);
            }
          });
        }
      });

      return Flipdown;

    })();
  })(window.jQuery, window);
});

ASAP(function() {
  var $flt_buttons, content_marker, track_group_click, updateInfoBlocks;
  $('body .subpage-search-bg > .background').append($('#_intro_markup').html());
  window.$countdown = $('.countdown-widget').Flipdown({
    momentX: moment('2023-01-08T23:59:59')
  });
  $countdown.on('time-is-up', function() {
    return $countdown.closest('section').slideUp();
  }).Flipdown('start');
  updateInfoBlocks = function(content_marker) {
    var $info_block_to_show;
    $info_block_to_show = $(".destination-detail[data-content-marker=\"" + content_marker + "\"]");
    if ($info_block_to_show.length) {
      return $info_block_to_show.addClass('shown').siblings('.shown').removeClass('shown');
    } else {
      return $('.destination-detail').removeClass('shown');
    }
  };
  $('#hotels-set .filters-wrap').after($('.destination-details'));
  $flt_buttons = $('.group-filters [data-group]');
  content_marker = $flt_buttons.filter('.selected').attr('data-group');
  updateInfoBlocks(content_marker);
  track_group_click = function(name) {
    var map;
    map = {
      '*': function() {
        return typeof window.ym === "function" ? window.ym(553380, 'reachGoal', 'ng_vse') : void 0;
      },
      'Турция': function() {
        return typeof window.ym === "function" ? window.ym(553380, 'reachGoal', 'ngtyr') : void 0;
      },
      'Таиланд': function() {
        return typeof window.ym === "function" ? window.ym(553380, 'reachGoal', 'ngtai') : void 0;
      },
      'ОАЭ': function() {
        return typeof window.ym === "function" ? window.ym(553380, 'reachGoal', 'ng_oae') : void 0;
      },
      'Египет': function() {
        return typeof window.ym === "function" ? window.ym(553380, 'reachGoal', 'ng_egypt') : void 0;
      }
    };
    return typeof map[name] === "function" ? map[name]() : void 0;
  };
  $flt_buttons.on('click', function() {
    var group_name;
    group_name = $(this).attr('data-group');
    updateInfoBlocks(group_name);
    return track_group_click(group_name);
  });
  return preload('https://cdnjs.cloudflare.com/ajax/libs/proton-engine/5.4.5/proton.min.js', function() {
    var $snowfall, canvas, emitter, proton, renderer, syncCanvas;
    $snowfall = $('<div id="snowfall"><canvas></canvas></div>');
    $('.incredible-decor').append($snowfall);
    canvas = $snowfall.find('canvas').get(0);
    proton = new Proton();
    emitter = new Proton.Emitter();
    emitter.rate = new Proton.Rate(Proton.getSpan(2, 7), 0.1);
    emitter.addInitialize(new Proton.Radius(1, 3));
    emitter.addInitialize(new Proton.Life(3, 10));
    emitter.addInitialize(new Proton.Velocity(new Proton.Span(.5, 2), new Proton.Span(150, 210), 'polar'));
    emitter.addInitialize(new Proton.Position(new Proton.LineZone(-700, 0, 700, 0)));
    emitter.addBehaviour(new Proton.Alpha(1, .3, new Proton.Span(2, 10)));
    emitter.addBehaviour(new Proton.RandomDrift(2, 0, 5));
    emitter.emit();
    proton.addEmitter(emitter);
    renderer = new Proton.CanvasRenderer(canvas);
    proton.addRenderer(renderer);
    syncCanvas = function() {
      canvas.width = $snowfall.width();
      canvas.height = $snowfall.height();
      emitter.p.x = canvas.width / 2;
      return emitter.p.y = 0;
    };
    $(window).on('resize orientationchange', syncCanvas);
    syncCanvas();
    return RAFManager.add(function() {
      return proton.update();
    });
  });
});
