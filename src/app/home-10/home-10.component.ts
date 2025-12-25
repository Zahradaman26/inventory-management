import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  NgApexchartsModule,
  ChartComponent
} from 'ng-apexcharts';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-home-10',
  standalone: true,
  imports: [NgApexchartsModule, BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home-10.component.html',
  styleUrl: './home-10.component.css'
})
export class Home10Component {
  title = 'Home 10';
  purchaseSaleChart;
  // incomeExpense;
  orderPieChartStatus;
  constructor() {


    // this.incomeExpense = this.createChartTwo('#487FFF', '#FF9F29');
    this.orderPieChartStatus = {
      series: [30, 30, 20, 20],
      colors: ['#FF9F29', '#45B369', '#487FFF', '#f52424ff'],
      labels: ['Requested', 'Approved', 'Issued', 'Rejected'],
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
        enabled: true
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
      tooltip: {
        custom: ({ seriesIndex, series, dataPointIndex, w }) => {
          const donutColor = w.globals.colors[seriesIndex];
          const label = w.config.labels[seriesIndex];
          return `
            <div style="font-size: 12px; padding:5px 10px; background-color: ${donutColor}; color: white; ">
              ${label}: ${series[seriesIndex]} 
            </div>
          `;
        }
      },
    };

    this.purchaseSaleChart = {
      series: [{
        name: 'Orders',
        data: [44, 100, 40, 56, 30, 58, 50]
      }, {
        name: 'Returns',
        data: [60, 120, 60, 90, 50, 95, 90]
      }],
      colors: ['#45B369', '#f52424ff'],
      labels: ['Active', 'New', 'Total'],

      legend: {
        show: false
      },
      chart: {
        type: 'bar',
        height: 260,
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
      fill: {
        opacity: 1,
        width: 18,
      },
    };

  }

  // createChartTwo(color1, color2) {
  //   return {
  //     series: [{
  //       name: 'series1',
  //       data: [48, 35, 50, 32, 48, 40, 55, 50, 60]
  //     }, {
  //       name: 'series2',
  //       data: [12, 20, 15, 26, 22, 30, 25, 35, 25]
  //     }],
  //     legend: {
  //       show: false
  //     },
  //     chart: {
  //       type: 'area',
  //       width: '100%',
  //       height: 270,
  //       toolbar: {
  //         show: false
  //       },
  //       padding: {
  //         left: 0,
  //         right: 0,
  //         top: 0,
  //         bottom: 0
  //       }
  //     },
  //     dataLabels: {
  //       enabled: false
  //     },
  //     stroke: {
  //       curve: 'smooth',
  //       width: 3,
  //       colors: [color1, color2], // Use two colors for the lines
  //       lineCap: 'round'
  //     },
  //     grid: {
  //       show: true,
  //       borderColor: '#D1D5DB',
  //       strokeDashArray: 1,
  //       position: 'back',
  //       xaxis: {
  //         lines: {
  //           show: false
  //         }
  //       },
  //       yaxis: {
  //         lines: {
  //           show: true
  //         }
  //       },
  //       row: {
  //         colors: undefined,
  //         opacity: 0.5
  //       },
  //       column: {
  //         colors: undefined,
  //         opacity: 0.5
  //       },
  //       padding: {
  //         top: -20,
  //         right: 0,
  //         bottom: -10,
  //         left: 0
  //       },
  //     },
  //     fill: {
  //       type: 'gradient',
  //       colors: [color1, color2], // Use two colors for the gradient
        // gradient: {
        //     shade: 'light',
        //     type: 'vertical',
        //     shadeIntensity: 0.5,
        //     gradientToColors: [`${color1}`, `${color2}00`], // Bottom gradient colors with transparency
        //     inverseColors: false,
        //     opacityFrom: .6,
        //     opacityTo: 0.3,
        //     stops: [0, 100],
        // },
  //       gradient: {
  //         shade: 'light',
  //         type: 'vertical',
  //         shadeIntensity: 0.5,
  //         gradientToColors: [undefined, `${color2}00`], // Apply transparency to both colors
  //         inverseColors: false,
  //         opacityFrom: [0.4, 0.6], // Starting opacity for both colors
  //         opacityTo: [0.3, 0.3], // Ending opacity for both colors
  //         stops: [0, 100],
  //       },
  //     },
  //     markers: {
  //       colors: [color1, color2], // Use two colors for the markers
  //       strokeWidth: 3,
  //       size: 0,
  //       hover: {
  //         size: 10
  //       }
  //     },
  //     xaxis: {
  //       categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  //       tooltip: {
  //         enabled: false
  //       },
  //       labels: {
  //         formatter: function (value) {
  //           return value;
  //         },
  //         style: {
  //           fontSize: "14px"
  //         }
  //       }
  //     },
  //     yaxis: {
  //       labels: {
  //         formatter: function (value) {
  //           return "$" + value + "k";
  //         },
  //         style: {
  //           fontSize: "14px"
  //         }
  //       },
  //     },
  //     tooltip: {
  //       x: {
  //         format: 'dd/MM/yy HH:mm'
  //       }
  //     }
  //   };

  // }
  cards = [
    {
      title: 'Products',
      amount: '$40,000',
      iconClass: 'ri-shopping-cart-fill',
      iconBg: 'bg-primary-100',
      iconText: 'text-primary-600',
      gradientClass: 'gradient-deep-1',
      lineBgClass: 'line-bg-primary',
      percentage: '80%',
      percentageIcon: 'ri-arrow-right-up-line',
      percentageClass: 'bg-success-focus text-success-main',
      note: 'From last month',
    },
    {
      title: 'Orders',
      amount: '$35,000',
      iconClass: 'ri-handbag-fill',
      iconBg: 'bg-lilac-200',
      iconText: 'text-lilac-600',
      gradientClass: 'gradient-deep-2',
      lineBgClass: 'line-bg-lilac',
      percentage: '95%',
      percentageIcon: 'ri-arrow-right-up-line',
      percentageClass: 'bg-success-focus text-success-main',
      note: 'From last month',
    },
    {
      title: 'Requests',
      amount: '$30,000',
      iconClass: 'ri-shopping-cart-fill',
      iconBg: 'bg-success-200',
      iconText: 'text-success-600',
      gradientClass: 'gradient-deep-3',
      lineBgClass: 'line-bg-success',
      percentage: '30%',
      percentageIcon: 'ri-arrow-right-down-line',
      percentageClass: 'bg-danger-focus text-danger-main',
      note: 'From last month',
    },
    {
      title: 'Vendors',
      amount: '$7,000',
      iconClass: 'ri-shopping-cart-fill',
      iconBg: 'bg-warning-focus',
      iconText: 'text-warning-600',
      gradientClass: 'gradient-deep-4',
      lineBgClass: 'line-bg-warning',
      percentage: '60%',
      percentageIcon: 'ri-arrow-right-up-line',
      percentageClass: 'bg-success-focus text-success-main',
      note: 'From last month',
    },
    {
      title: 'Returns',
      amount: '$7,000',
      iconClass: 'ri-shopping-cart-fill',
      iconBg: 'bg-warning-focus',
      iconText: 'text-warning-600',
      gradientClass: 'gradient-deep-4',
      lineBgClass: 'line-bg-warning',
      percentage: '60%',
      percentageIcon: 'ri-arrow-right-up-line',
      percentageClass: 'bg-success-focus text-success-main',
      note: 'From last month',
    },
    {
      title: 'Purchase Orders',
      amount: '$7,000',
      iconClass: 'ri-shopping-cart-fill',
      iconBg: 'bg-warning-focus',
      iconText: 'text-warning-600',
      gradientClass: 'gradient-deep-4',
      lineBgClass: 'line-bg-warning',
      percentage: '60%',
      percentageIcon: 'ri-arrow-right-up-line',
      percentageClass: 'bg-success-focus text-success-main',
      note: 'From last month',
    },
  ];
  // departments = [
  //   {
  //     img: 'assets/images/user-grid/user-grid-img1.png',
  //     name: 'Psychiatry',
  //     role: 'Super Admin',
  //     status: 'Pending',
  //     statusClass: 'text-warning-main',
  //   },
  //   {
  //     img: 'assets/images/user-grid/user-grid-img2.png',
  //     name: 'Orthopedic',
  //     role: 'Admin',
  //     status: 'Active',
  //     statusClass: 'text-success-main',
  //   },
  //   {
  //     img: 'assets/images/user-grid/user-grid-img3.png',
  //     name: 'Cardiology',
  //     role: 'Manager',
  //     status: 'Active',
  //     statusClass: 'text-success-main',
  //   },
  //   {
  //     img: 'assets/images/user-grid/user-grid-img4.png',
  //     name: 'Pediatrics',
  //     role: 'Admin',
  //     status: 'Active',
  //     statusClass: 'text-success-main',
  //   },
  //   {
  //     img: 'assets/images/user-grid/user-grid-img1.png',
  //     name: 'Neurology',
  //     role: 'Manager',
  //     status: 'Active',
  //     statusClass: 'text-success-main',
  //   },
  // ];

  // topSupplier = [
  //   { sl: 1, name: 'Esther Howard', amount: '$30,00.00' },
  //   { sl: 2, name: 'Wade Warren', amount: '$40,00.00' },
  //   { sl: 3, name: 'Jenny Wilson', amount: '$50,00.00' },
  //   { sl: 4, name: 'Kristin Watson', amount: '$60,00.00' },
  //   { sl: 5, name: 'Eleanor Pena', amount: '$70,00.00' },
  //   { sl: 6, name: 'Darlene Robertson', amount: '$80,00.00' },
  // ];
  // topCustomer = [
  //   { sl: 1, name: 'Savannah Nguyen', amount: '$30,00.00' },
  //   { sl: 2, name: 'Annette Black', amount: '$40,00.00' },
  //   { sl: 3, name: 'Theresa Webb', amount: '$50,00.00' },
  //   { sl: 4, name: 'Marvin McKinney', amount: '$60,00.00' },
  //   { sl: 5, name: 'Brooklyn Simmons', amount: '$70,00.00' },
  //   { sl: 6, name: 'Dianne Russell', amount: '$80,00.00' },
  // ];

  // transactions = [
  //   { sl: 1, date: '21 Jun 2024', method: 'Cash', debit: '$0.00', credit: '$150.00', balance: '$150.00' },
  //   { sl: 2, date: '21 Jun 2024', method: 'Bank', debit: '$570', credit: '$0.00', balance: '$570.00' },
  //   { sl: 3, date: '21 Jun 2024', method: 'PayPal', debit: '$300.00', credit: '$100.00', balance: '$200.00' },
  //   { sl: 4, date: '21 Jun 2024', method: 'Cash', debit: '$0.00', credit: '$150.00', balance: '$150.00' },
  //   { sl: 5, date: '21 Jun 2024', method: 'PayPal', debit: '$300.00', credit: '$100.00', balance: '$200.00' },
  // ];
}
