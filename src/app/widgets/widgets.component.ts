import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { WorldMapComponent } from '../world-map/world-map.component';

@Component({
  selector: 'app-widgets',
  standalone: true,
  imports: [NgApexchartsModule, BreadcrumbComponent, WorldMapComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './widgets.component.html',
  styleUrl: './widgets.component.css'
})
export class WidgetsComponent implements AfterViewInit {
  title = 'Widgets';
  newUserChart;
  activeUserChart;
  totalSalesChart;
  conversionUserChart;
  chart; bitcoinAreaChart; ethereumAreaChart; solanaAreaChart; litecoinAreaChart; dogecoinAreaChart;
  areaChart;
  dailyIconBarChart;
  barChart; userOverviewDonutChart; paymentStatusChart; transactionLineChart; semiCircleGauge;
  constructor() {
    this.newUserChart = this.createWidgetChart('#487fff');
    this.activeUserChart = this.createWidgetChart('#45b369');
    this.totalSalesChart = this.createWidgetChart('#f4941e');
    this.conversionUserChart = this.createWidgetChart('#8252e9');


    this.bitcoinAreaChart = this.createCoinChart('bitcoinAreaChart', '#F98C08');
    this.ethereumAreaChart = this.createCoinChart('ethereumAreaChart', '#5F80FF');
    this.solanaAreaChart = this.createCoinChart('solanaAreaChart', '#C817F8');
    this.litecoinAreaChart = this.createCoinChart('litecoinAreaChart', '#2171EA');
    this.dogecoinAreaChart = this.createCoinChart('dogecoinAreaChart', '#C2A633');

    this.areaChart = this.createChart('#FF9F29');

    this.chart = {
      series: [{
        name: "This month",
        data: [10, 20, 12, 30, 14, 35, 16, 32, 14, 25, 13, 28]
      }],
      chart: {
        height: 264,
        type: 'line',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        dropShadow: {
          enabled: true,
          top: 6,
          left: 0,
          blur: 4,
          color: "#000",
          opacity: 0.1,
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        colors: ['#487FFF'], // Specify the line color here
        width: 3
      },
      markers: {
        size: 0,
        strokeWidth: 3,
        hover: {
          size: 8
        }
      },
      tooltip: {
        enabled: true,
        x: {
          show: true,
        },
        y: {
          show: false,
        },
        z: {
          show: false,
        }
      },
      grid: {
        row: {
          colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5
        },
        borderColor: '#D1D5DB',
        strokeDashArray: 3,
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            return "$" + value + "k";
          },
          style: {
            fontSize: "14px"
          }
        },
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        tooltip: {
          enabled: false
        },
        labels: {
          formatter: function (value) {
            return value;
          },
          style: {
            fontSize: "14px"
          }
        },
        axisBorder: {
          show: false
        },
        crosshairs: {
          show: true,
          width: 20,
          stroke: {
            width: 0
          },
          fill: {
            type: 'solid',
            color: '#487FFF40',
            // gradient: {
            //   colorFrom: '#D8E3F0',
            //   // colorTo: '#BED1E6',
            //   stops: [0, 100],
            //   opacityFrom: 0.4,
            //   opacityTo: 0.5,
            // },
          }
        }
      }
    };

    this.barChart = {
      series: [{
        name: "Sales",
        data: [{
          x: 'Jan',
          y: 85000,
        }, {
          x: 'Feb',
          y: 70000,
        }, {
          x: 'Mar',
          y: 40000,
        }, {
          x: 'Apr',
          y: 50000,
        }, {
          x: 'May',
          y: 60000,
        }, {
          x: 'Jun',
          y: 50000,
        }, {
          x: 'Jul',
          y: 40000,
        }, {
          x: 'Aug',
          y: 50000,
        }, {
          x: 'Sep',
          y: 40000,
        }, {
          x: 'Oct',
          y: 60000,
        }, {
          x: 'Nov',
          y: 30000,
        }, {
          x: 'Dec',
          y: 50000,
        }]
      }],
      chart: {
        type: 'bar',
        height: 310,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: '23%',
          endingShape: 'rounded',
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        colors: ['#487FFF'], // Set the starting color (top color) here
        gradient: {
          shade: 'light', // Gradient shading type
          type: 'vertical',  // Gradient direction (vertical)
          shadeIntensity: 0.5, // Intensity of the gradient shading
          gradientToColors: ['#487FFF'], // Bottom gradient color (with transparency)
          inverseColors: false, // Do not invert colors
          opacityFrom: 1, // Starting opacity
          opacityTo: 1,  // Ending opacity
          stops: [0, 100],
        },
      },
      grid: {
        show: true,
        borderColor: '#D1D5DB',
        strokeDashArray: 4, // Use a number for dashed style
        position: 'back',
      },
      xaxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            return (value / 1000).toFixed(0) + 'k';
          }
        }
      },
      tooltip: {
        y: {
          formatter: function (value) {
            return value / 1000 + 'k';
          }
        }
      }
    };


    this.userOverviewDonutChart = {
      series: [500, 500, 500],
      colors: ['#FF9F29', '#487FFF', '#E4F1FF'],
      labels: ['Active', 'New', 'Total'],
      legend: {
        show: false
      },
      chart: {
        type: 'donut',
        height: 270,
        sparkline: {
          enabled: true // Remove whitespace
        },
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      stroke: {
        width: 0,
      },
      dataLabels: {
        enabled: false
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
    };

    this.paymentStatusChart = {
      series: [{
        name: 'Net Profit',
        data: [44, 100, 40, 56, 30, 58, 50]
      }, {
        name: 'Revenue',
        data: [90, 140, 80, 125, 70, 140, 110]
      }, {
        name: 'Free Cash',
        data: [60, 120, 60, 90, 50, 95, 90]
      }],
      colors: ['#45B369', '#144bd6', '#FF9F29'],
      labels: ['Active', 'New', 'Total'],

      legend: {
        show: false
      },
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        },
      },
      grid: {
        show: true,
        borderColor: '#D1D5DB',
        strokeDashArray: 4, // Use a number for dashed style
        position: 'back',
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: 8,
        },
      },
      dataLabels: {
        enabled: false
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        }
      },
      stroke: {
        show: true,
        width: 0,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'],
      },
      yaxis: {
        categories: ['0', '10,000', '20,000', '30,000', '50,000', '1,00,000', '1,00,000'],
      },
      fill: {
        opacity: 1,
        width: 18,
      },
    };

    this.transactionLineChart = {
      series: [{
        name: "This month",
        data: [4, 16, 12, 28, 22, 38, 23]
      }],
      chart: {
        height: 290,
        type: 'line',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        dropShadow: {
          enabled: true,
          top: 6,
          left: 0,
          blur: 4,
          color: "#000",
          opacity: 0.1,
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      markers: {
        size: 0,
        strokeWidth: 3,
        hover: {
          size: 8
        }
      },
      tooltip: {
        enabled: true,
        x: {
          show: true,
        },
        y: {
          show: false,
        },
        z: {
          show: false,
        }
      },
      grid: {
        row: {
          colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5
        },
        borderColor: '#D1D5DB',
        strokeDashArray: 3,
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            return "$" + value + "k";
          },
          style: {
            fontSize: "14px"
          }
        },
      },
      xaxis: {
        categories: ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'],
        tooltip: {
          enabled: false
        },
        labels: {
          formatter: function (value) {
            return value;
          },
          style: {
            fontSize: "14px"
          }
        },
        axisBorder: {
          show: false
        },
        crosshairs: {
          show: true,
          width: 20,
          stroke: {
            width: 0
          },
          fill: {
            type: 'solid',
            color: '#B1B9C4',
            gradient: {
              colorFrom: '#D8E3F0',
              colorTo: '#BED1E6',
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5,
            },
          }
        }
      }
    };


    this.semiCircleGauge = {
      series: [75],
      chart: {
        height: 165,
        width: 120,
        type: 'radialBar',
        sparkline: {
          enabled: false // Remove whitespace
        },
        toolbar: {
          show: false
        },
        padding: {
          left: -32,
          right: -32,
          top: -32,
          bottom: -32
        },
        margin: {
          left: -32,
          right: -32,
          top: -32,
          bottom: -32
        }
      },
      plotOptions: {
        radialBar: {
          offsetY: -24,
          offsetX: -14,
          startAngle: -90,
          endAngle: 90,
          track: {
            background: "#E3E6E9",
            // strokeWidth: 32,
            dropShadow: {
              enabled: false,
              top: 2,
              left: 0,
              color: '#999',
              opacity: 1,
              blur: 2
            }
          },
          dataLabels: {
            show: false,
            name: {
              show: false
            },
            value: {
              offsetY: -2,
              fontSize: '22px'
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        colors: ['#9DBAFF'],
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#487FFF'],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      stroke: {
        lineCap: 'round',
      },
      labels: ['Percent'],
    };

    this.dailyIconBarChart = {
      series: [{
        name: "Sales",
        data: [{
          x: 'Mon',
          y: 20,
        }, {
          x: 'Tue',
          y: 40,
        }, {
          x: 'Wed',
          y: 20,
        }, {
          x: 'Thur',
          y: 30,
        }, {
          x: 'Fri',
          y: 40,
        }, {
          x: 'Sat',
          y: 35,
        }]
      }],
      chart: {
        type: 'bar',
        width: 164,
        height: 80,
        sparkline: {
          enabled: true // Remove whitespace
        },
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          horizontal: false,
          columnWidth: 14,
        }
      },
      dataLabels: {
        enabled: false
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        }
      },
      fill: {
        type: 'gradient',
        colors: ['#E3E6E9'], // Set the starting color (top color) here
        gradient: {
          shade: 'light', // Gradient shading type
          type: 'vertical',  // Gradient direction (vertical)
          shadeIntensity: 0.5, // Intensity of the gradient shading
          gradientToColors: ['#E3E6E9'], // Bottom gradient color (with transparency)
          inverseColors: false, // Do not invert colors
          opacityFrom: 1, // Starting opacity
          opacityTo: 1,  // Ending opacity
          stops: [0, 100],
        },
      },
      grid: {
        show: false,
        borderColor: '#D1D5DB',
        strokeDashArray: 1, // Use a number for dashed style
        position: 'back',
      },
      xaxis: {
        labels: {
          show: false // Hide y-axis labels
        },
        type: 'category',
        categories: ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat']
      },
      yaxis: {
        labels: {
          show: false,
          formatter: function (value) {
            return (value / 1000).toFixed(0) + 'k';
          }
        }
      },
      tooltip: {
        y: {
          formatter: function (value) {
            return value / 1000 + 'k';
          }
        }
      }
    };
   }

  ngAfterViewInit() {

   

  }



  createWidgetChart(chartColor) {

    let currentYear = new Date().getFullYear();

    return {
      series: [
        {
          name: 'series1',
          data: [35, 45, 38, 41, 36, 43, 37, 55, 40],
        },
      ],
      chart: {
        type: 'area',
        width: 100,
        height: 42,
        sparkline: {
          enabled: true // Remove whitespace
        },

        toolbar: {
          show: false
        },
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: [chartColor],
        lineCap: 'round'
      },
      grid: {
        show: true,
        borderColor: 'transparent',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        row: {
          colors: undefined,
          opacity: 0.5
        },
        column: {
          colors: undefined,
          opacity: 0.5
        },
        padding: {
          top: -3,
          right: 0,
          bottom: 0,
          left: 0
        },
      },
      fill: {
        type: 'gradient',
        colors: [chartColor], // Set the starting color (top color) here
        gradient: {
          shade: 'light', // Gradient shading type
          type: 'vertical',  // Gradient direction (vertical)
          shadeIntensity: 0.5, // Intensity of the gradient shading
          gradientToColors: [`${chartColor}00`], // Bottom gradient color (with transparency)
          inverseColors: false, // Do not invert colors
          opacityFrom: .75, // Starting opacity
          opacityTo: 0.3,  // Ending opacity
          stops: [0, 100],
        },
      },
      // Customize the circle marker color on hover
      markers: {
        colors: [chartColor],
        strokeWidth: 2,
        size: 0,
        hover: {
          size: 8
        }
      },
      xaxis: {
        labels: {
          show: false
        },
        categories: [`Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`, `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`, `Jul ${currentYear}`, `Aug ${currentYear}`, `Sep ${currentYear}`, `Oct ${currentYear}`, `Nov ${currentYear}`, `Dec ${currentYear}`],
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        labels: {
          show: false
        }
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      },
    };

  }


  createCoinChart(chartId, chartColor) {

    let currentYear = new Date().getFullYear();

    return {
      series: [
        {
          name: 'series1',
          data: [31, 24, 30, 25, 32, 28, 40, 32, 42, 38, 40, 32, 38, 35, 45],
        },
      ],
      chart: {
        type: 'area',
        width: 150,
        height: 70,

        sparkline: {
          enabled: true // Remove whitespace
        },

        toolbar: {
          show: false
        },
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        },
        events: {
          mounted: (chartContext, config) => {
            // Apply CSS blur to markers
            document.querySelectorAll(`#${chartId} .apexcharts-marker`).forEach((marker: HTMLElement) => {
              marker.style.filter = 'blur(2px)';
            });
          },
          updated: (chartContext, config) => {
            // Apply CSS blur to markers
            document.querySelectorAll(`#${chartId} .apexcharts-marker`).forEach((marker: HTMLElement) => {
              marker.style.filter = 'blur(3px)';
            });
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: [chartColor],
        lineCap: 'round'
      },
      grid: {
        show: true,
        borderColor: 'transparent',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        row: {
          colors: undefined,
          opacity: 0.5
        },
        column: {
          colors: undefined,
          opacity: 0.5
        },
        padding: {
          top: -3,
          right: 0,
          bottom: 0,
          left: 0
        },
      },
      fill: {
        type: 'gradient',
        colors: [chartColor], // Set the starting color (top color) here
        gradient: {
          shade: 'light', // Gradient shading type
          type: 'vertical',  // Gradient direction (vertical)
          shadeIntensity: 0.5, // Intensity of the gradient shading
          gradientToColors: [`${chartColor}00`], // Bottom gradient color (with transparency)
          inverseColors: false, // Do not invert colors
          opacityFrom: .7, // Starting opacity
          opacityTo: 0.3,  // Ending opacity
          stops: [0, 100],
        },
      },
      // Customize the circle marker color on hover
      markers: {
        colors: [chartColor],
        strokeWidth: 2,
        size: 0,
        hover: {
          size: 8
        }
      },
      xaxis: {
        labels: {
          show: false
        },
        categories: [`Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`, `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`, `Jul ${currentYear}`, `Aug ${currentYear}`, `Sep ${currentYear}`, `Oct ${currentYear}`, `Nov ${currentYear}`, `Dec ${currentYear}`],
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        labels: {
          show: false
        }
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      },
    };

  }


  createChart(chartColor) {

    let currentYear = new Date().getFullYear();

    return {
      series: [
        {
          name: 'series1',
          data: [0, 10, 8, 25, 15, 26, 13, 35, 15, 39, 16, 46, 42],
        },
      ],
      chart: {
        type: 'area',
        width: 164,
        height: 72,

        sparkline: {
          enabled: true // Remove whitespace
        },

        toolbar: {
          show: false
        },
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: [chartColor],
        lineCap: 'round'
      },
      grid: {
        show: true,
        borderColor: 'transparent',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        row: {
          colors: undefined,
          opacity: 0.5
        },
        column: {
          colors: undefined,
          opacity: 0.5
        },
        padding: {
          top: -3,
          right: 0,
          bottom: 0,
          left: 0
        },
      },
      fill: {
        type: 'gradient',
        colors: [chartColor], // Set the starting color (top color) here
        gradient: {
          shade: 'light', // Gradient shading type
          type: 'vertical',  // Gradient direction (vertical)
          shadeIntensity: 0.5, // Intensity of the gradient shading
          gradientToColors: [`${chartColor}00`], // Bottom gradient color (with transparency)
          inverseColors: false, // Do not invert colors
          opacityFrom: .8, // Starting opacity
          opacityTo: 0.3,  // Ending opacity
          stops: [0, 100],
        },
      },
      // Customize the circle marker color on hover
      markers: {
        colors: [chartColor],
        strokeWidth: 2,
        size: 0,
        hover: {
          size: 8
        }
      },
      xaxis: {
        labels: {
          show: false
        },
        categories: [`Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`, `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`, `Jul ${currentYear}`, `Aug ${currentYear}`, `Sep ${currentYear}`, `Oct ${currentYear}`, `Nov ${currentYear}`, `Dec ${currentYear}`],
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        labels: {
          show: false
        }
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      },
    };

  }


}
