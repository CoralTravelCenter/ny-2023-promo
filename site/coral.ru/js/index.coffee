window.ASAP = (->
    fns = []
    callall = () ->
        f() while f = fns.shift()
    if document.addEventListener
        document.addEventListener 'DOMContentLoaded', callall, false
        window.addEventListener 'load', callall, false
    else if document.attachEvent
        document.attachEvent 'onreadystatechange', callall
        window.attachEvent 'onload', callall
    (fn) ->
        fns.push fn
        callall() if document.readyState is 'complete'
)()

log = () ->
    if window.console and window.DEBUG
        console.group? window.DEBUG
        if arguments.length == 1 and Array.isArray(arguments[0]) and console.table
            console.table.apply window, arguments
        else
            console.log.apply window, arguments
        console.groupEnd?()
trouble = () ->
    if window.console
        console.group? window.DEBUG if window.DEBUG
        console.warn?.apply window, arguments
        console.groupEnd?() if window.DEBUG

window.preload = (what, fn) ->
    what = [what] unless  Array.isArray(what)
    $.when.apply($, ($.ajax(lib, dataType: 'script', cache: true) for lib in what)).done -> fn?()

window.queryParam = queryParam = (p, nocase) ->
    params_kv = location.search.substr(1).split('&')
    params = {}
    params_kv.forEach (kv) -> k_v = kv.split('='); params[k_v[0]] = k_v[1] or ''
    if p
        if nocase
            return decodeURIComponent(params[k]) for k of params when k.toUpperCase() == p.toUpperCase()
            return undefined
        else
            return decodeURIComponent params[p]
    params

String::zeroPad = (len, c) ->
    s = ''
    c ||= '0'
    len ||= 2
    len -= @length
    s += c while s.length < len
    s + @
Number::zeroPad = (len, c) -> String(@).zeroPad len, c

Number::pluralForm = (root, suffix_list) ->
    root + (if this >= 11 && this <= 14 then suffix_list[0] else suffix_list[this % 10]);
Number::asDays = () ->
    d = Math.floor(this)
    d.pluralForm('д', ['ней', 'ень', 'ня', 'ня', 'ня', 'ней', 'ней', 'ней', 'ней', 'ней'])
Number::asHours = () ->
    d = Math.floor(this)
    d.pluralForm('час', ['ов', '', 'а', 'а', 'а', 'ов', 'ов', 'ов', 'ов', 'ов'])
Number::asMinutes = () ->
    d = Math.floor(this)
    d.pluralForm('минут', ['', 'а', 'ы', 'ы', 'ы', '', '', '', '', ''])
Number::asSeconds = () ->
    d = Math.floor(this)
    d.pluralForm('секунд', ['', 'а', 'ы', 'ы', 'ы', '', '', '', '', ''])


ASAP ->
    do($ = window.jQuery, window) ->
        class Flipdown
            defaults:
                momentX: moment().add({ d: 2 })
                labels: yes
                overMessage: ''

            constructor: (el, options) ->
                @options = $.extend({}, @defaults, options)
                @$el = $(el)
                @server_moment = moment()
                @time_gap = moment.duration(0)
                @init()

            init: () ->
                $.ajax('/', method: 'HEAD').then (a,b,c) =>
                    @server_moment = moment(c.getResponseHeader('Date'))
                    @time_gap = moment.duration(@server_moment.diff(moment()))
                @

            tick: () ->
                remains = moment.duration(@options.momentX.diff(moment())).add(@time_gap)
                if remains.asSeconds() <= 0
                    @over()
                    return @
                @render(remains).then =>
                    @rafh = requestAnimationFrame => @tick()
                @

            start: () ->
                @rafh = requestAnimationFrame => @tick()
                @

            stop: () ->
                cancelAnimationFrame @rafh if @rafh
                @

            over: () ->
                @stop()
                if @options.overMessage
                    msg_letters = @options.overMessage.split ''
                    pad = 8 - msg_letters.length
                    msg_letters.unshift ' ' while pad--
                    @render
                        days: -> (msg_letters[0] or ' ') + (msg_letters[1] or ' ')
                        hours: -> (msg_letters[2] or ' ') + (msg_letters[3] or ' ')
                        minutes: -> (msg_letters[4] or ' ') + (msg_letters[5] or ' ')
                        seconds: -> (msg_letters[6] or ' ') + (msg_letters[7] or ' ')
                    .then => @$el.trigger('time-is-up')
                    @$el.find('.label').css visibility: 'hidden'
                else
                    @$el.trigger('time-is-up')
                @

            render: (remains) ->
                hit_non_zero_rank = false
                promise = $.Deferred()
                @$el.find('[data-units]').each (idx, el) =>
                    $units = $(el)
                    units = $units.attr('data-units')
                    value = Number($units.attr('data-value'))
                    value2set = remains[units]()
                    hit_non_zero_rank ||= value2set != 0
                    $units.addClass 'insignificant' unless hit_non_zero_rank
                    if value2set != value
                        $units.attr 'data-value', value2set
                        digits2set = value2set.zeroPad(2)
                        $stacks = $units.find('.flipper-stack')
                        $.when(@flipStack2($stacks.eq(0), digits2set[0]), @flipStack2($stacks.eq(1), digits2set[1])).then -> promise.resolve()
                        try
                            $units.find('.label').text value2set[{
                                days: 'asDays',
                                hours: 'asHours',
                                minutes: 'asMinutes',
                                seconds: 'asSeconds'
                            }[units]]() if @options.labels
                    else
                        promise.resolve()
                promise

            flipStack2: (stack_el, n) ->
                $stack_el = $(stack_el)
                promise = $.Deferred()
                $recent_flippers = $stack_el.children()
                $last_flipper = $recent_flippers.eq(-1)
                if $last_flipper.attr('data-digit') != String(n)
                    $new_flipper = $ "<div class='flipper flip-in' data-digit='#{ n }'></div>"
                    $stack_el.append $new_flipper
                    $last_flipper.addClass 'flip-out'
                    setTimeout ->
                        $new_flipper.one 'transitionend transitioncancel', ->
                            $recent_flippers.remove()
                            promise.resolve()
                        .removeClass 'flip-in'
                    , 0
                else
                    promise.resolve()
                promise

            # Define the plugin
            $.fn.extend Flipdown: (option, args...) ->
                @each ->
                    $this = $(this)
                    data = $this.data('Flipdown')
                    if !data
                        $this.data 'Flipdown', (data = new Flipdown(this, option))
                    if typeof option == 'string'
                        data[option].apply(data, args)

ASAP ->
    $('body .subpage-search-bg > .background').append $('#_intro_markup').html()

    window.$countdown = $('.countdown-widget').Flipdown
        momentX: moment('2023-01-08T23:59:59')
    $countdown.on 'time-is-up', ->
        $countdown.closest('section').slideUp()
    .Flipdown('start')

    updateInfoBlocks = (content_marker) ->
        $info_block_to_show = $(".destination-detail[data-content-marker=\"#{ content_marker }\"]")
        if $info_block_to_show.length
            $info_block_to_show.addClass('shown').siblings('.shown').removeClass('shown')
        else
            $('.destination-detail').removeClass('shown')

    $('#hotels-set .filters-wrap').after($('.destination-details'))
    $flt_buttons = $('.group-filters [data-group]')
    content_marker = $flt_buttons.filter('.selected').attr('data-group')
    updateInfoBlocks content_marker

    $flt_buttons.on 'click', -> updateInfoBlocks $(this).attr('data-group')

    preload 'https://cdnjs.cloudflare.com/ajax/libs/proton-engine/5.4.5/proton.min.js', ->
        $snowfall = $('<div id="snowfall"><canvas></canvas></div>')
        $('.incredible-decor').append($snowfall)
        canvas = $snowfall.find('canvas').get(0)
        proton = new Proton();
        emitter = new Proton.Emitter()
        emitter.rate = new Proton.Rate(Proton.getSpan(2, 7), 0.1)
        emitter.addInitialize(new Proton.Radius(1, 3))
        emitter.addInitialize(new Proton.Life(3, 10))
        emitter.addInitialize(new Proton.Velocity(new Proton.Span(.5, 2), new Proton.Span(150, 210), 'polar'))
        emitter.addInitialize(new Proton.Position(new Proton.LineZone(-700, 0, 700, 0)))
        emitter.addBehaviour(new Proton.Alpha(1, .3, new Proton.Span(2, 10)))
        emitter.addBehaviour(new Proton.RandomDrift(2, 0, 5))
        emitter.emit()
        proton.addEmitter(emitter)
        renderer = new Proton.CanvasRenderer(canvas)
        proton.addRenderer(renderer)
        syncCanvas = ->
            canvas.width = $snowfall.width();
            canvas.height = $snowfall.height();
            emitter.p.x = canvas.width / 2;
            return emitter.p.y = 0;
        $(window).on 'resize orientationchange', syncCanvas
        syncCanvas()
        RAFManager.add -> proton.update()
