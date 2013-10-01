/**
 * Shows different chart statistics of the machines.
 */
plainvm.register('ui.vm_statistics', (function () {

    var container,
        CHART_SIZE_RATIO = 0.305,
        DONUT_INNER_RADIUS_RATIO = 0.03,
        DONUT_RADIUS_RATIO = 0.1,
        charts = [],
        sandbox;

    /**
     * Initializing the module.
     *
     * @public
     * @param {object} sndbx The sandbox.
     */
    function init(sndbx) {
        sandbox = sndbx;
        sandbox.subscribe('system-loading-completed', function () {
            container = $('#plainvm-vm-statistics');
        });
        sandbox.subscribe('ui-statistics-opened', function () {
            destroyCharts();
            initCharts();
        });
    }

    /**
     * Initializes all charts and keeps references for their parent DOM objects.
     *
     * @private
     */
    function initCharts() {
        charts.push(initOSChart());
        charts.push(initRAMChart());
        charts.push(initVRAMChart());
    }

    /**
     * Initializes the chat which is illustrating the operating system usage.
     * Currently it's putting the OSs in two groups - linux, win.
     *
     * @private
     * @return {object} the jQuery DOM object which is the actual chart.
     */
    function initOSChart() {
        var vms = sandbox.getVms(),
            osChart = $('<div class="plainvm-chart" style="float: right;" id="plainvm-os-chart"></div>');
        osChart.width(container.width() * CHART_SIZE_RATIO);
        osChart.height(container.width() * CHART_SIZE_RATIO);
        osChart.appendTo(container);
        osChart.jqxChart({
            title: 'Operating systems',
            enableAnimations: true,
            showLegend: true,
            source: getOSSource(vms),
            colorScheme: 'scheme05',
            seriesGroups: [{
                type: 'pie',
                showLabels: false,
                series: [{
                        dataField: 'count',
                        displayText: 'os',
                        initialAngle: 15,
                        radius: container.width() * DONUT_RADIUS_RATIO,
                        centerOffset: 0
                }]
            }]
        });
        return osChart;
    }

    /**
     * Initializes the RAM chart. This shows the RAM usage by the different machines.
     *
     * @private
     * @return {object} the jQuery DOM object which is the actual chart.
     */
   function initRAMChart() {
        var vms = sandbox.getVms(),
            ramChart = $('<div class="plainvm-chart" style="float: right;" id="plainvm-ram-chart"></div>'),
            source = getRAMSource(vms),
            max = 0;
        for (var i = 0; i < source.length; i += 1) {
            if (max < source[i].ram) {
                max = source[i].ram;
            }
        }
        ramChart.width(container.width() * CHART_SIZE_RATIO);
        ramChart.height(container.width() * CHART_SIZE_RATIO);
        ramChart.appendTo(container);
        ramChart.jqxChart({
            title: 'RAM usage',
            enableAnimations: true,
            showLegend: true,
            source: source,
            colorScheme: 'scheme05',
            categoryAxis: {
                dataField: 'name',
                showGridLines: true,
                flip: false
            },
            seriesGroups: [{
                type: 'column',
                orientation: 'horizontal',
                valueAxis: {
                    flip: true,
                    unitInterval: Math.round(max / 10),
                    maxValue: max,
                    displayValueAxis: true,
                    description: ''
                },
                series: [{
                    dataField: 'ram',
                    displayText: 'RAM usage',
                    formatFunction: function (val) {
                        return val + ' MB';
                    }
                }]
            }]
        });
        return ramChart;
    }


    /**
     * Chart which shows the video RAM usage by machine.
     *
     * @private
     * @return {object} the jQuery DOM object which is the actual chart.
     */
   function initVRAMChart() {
        var vms = sandbox.getVms(),
            vramChart = $('<div class="plainvm-chart" style="float: right;" id="plainvm-vram-chart"></div>'),
            source = getVRAMSource(vms),
            max = 0;
        for (var i = 0; i < source.length; i += 1) {
            if (max < source[i].vram) {
                max = source[i].vram;
            }
        }
        vramChart.width(container.width() * CHART_SIZE_RATIO);
        vramChart.height(container.width() * CHART_SIZE_RATIO);
        vramChart.appendTo(container);
        vramChart.jqxChart({
            title: 'Video memory',
            enableAnimations: true,
            showLegend: true,
            source: source,
            colorScheme: 'scheme05',
            categoryAxis: {
                dataField: 'name',
                showGridLines: true,
                flip: false
            },
            seriesGroups: [{
                type: 'column',
                orientation: 'horizontal',
                valueAxis: {
                    flip: true,
                    unitInterval: Math.round(max / 5),
                    maxValue: max,
                    displayValueAxis: true,
                    description: ''
                },
                series: [{
                    dataField: 'vram',
                    displayText: 'VRAM usage',
                    formatFunction: function (val) {
                        return val + ' MB';
                    }
                  }
                ]
            }]
        });
        return vramChart;
    }

    /**
     * Translates the VRAM usage by the different machines into format which is readable by the chart API.
     *
     * @private
     * @param {object} vms Map with all vms (key is the machine id).
     * @return {object} vms Readable result.
     */
    function getVRAMSource(vms) {
        var result = [],
            vm;
        for (var prop in vms) {
            vm = vms[prop];
            result.push({ name: vm.name, vram: parseInt(vm.vram, 10) });
        }
        return result;
    }

    /**
     * Gets the different machine types.
     *
     * @private
     * @param {object} vms Map with all vms (key is the machine id).
     * @return {object} readable result.
     */
    function getOSSource(vms) {
        var result = [],
            osCount = {},
            os,
            vm;
        for (var prop in vms) {
            vm = vms[prop];
            os = sandbox.getVMOs(vm.os);
            if (!osCount[os]) {
                osCount[os] = 1;
            } else {
                osCount[os] += 1;
            }
        }
        for (var osProp in osCount) {
            result.push({ os: osProp, count: osCount[osProp] });
        }
        return result;
    }

    /**
     * Translates the result into readable one for the chart API.
     *
     * @private
     * @param {object} vms Actually hash with keys the machine's ids and values the vms.
     * @return {object} readable result
     */
    function getRAMSource(vms) {
        var result = [],
            vm;
        for (var prop in vms) {
            vm = vms[prop];
            result.push({ name: vm.name, ram: parseInt(vm.ram, 10) });
        }
        return result;
    }

    /**
     * Destroying all charts.
     * 
     * @private
     */
    function destroyCharts() {
        for (var i = 0; i < charts.length; i += 1) {
            charts[i].jqxChart('destroy');
            charts[i].remove();
        }
        charts = [];
    }

    return {
        init: init
    };
}()));