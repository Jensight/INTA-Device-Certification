export const ADMIN_MENU_ITEMS = [
  {
    title: 'Dashboard',
    icon: 'home',
    link: '/pages/dashboard',
    active: true,
    home: true,
  },
  {
    title: 'Test Scheduler',
    icon: 'timeline',
    link: '',
    active: false,
    children: [
      {
        title: 'Scheduler',
        link: '/pages/test-scheduler/configure',
        icon: 'date_range',
      },
      {
        title: 'Quick Scheduler',
        link: '/pages/test-scheduler/quickScheduler',
        icon: 'schedule',
      },
      {
        title: 'Auto Regression',
        link: '/pages/test-scheduler/autoRegression',
        icon: 'update',
      },
      {
        title: 'Dynamic Scheduler',
        link: '/pages/test-scheduler/dynamicScheduler',
        icon: 'dynamic_feed',
      }
    ],
  },
  {
    title: 'Lab View',
    icon: 'dashboard',
    link: '/pages/lab-setup',
    active: false,
  },
  {
    title: 'Inventory',
    icon: 'lan',
    link: '',
    active: false,
    children: [
      {
        title: 'Device Inventory',
        link: '/pages/device-inventory/device-variables',
        icon: 'smartphone',
         active: false,
         hasTabs: true,
         tabs: ['/pages/device-inventory/device-variables', '/pages/device-inventory/device-profile',
         '/pages/device-inventory/vendor-model', '/pages/device-inventory/device']
      },
      {
        title: 'API Inventory',
        link: '/pages/api-inventory/group',
        icon: 'link',
         active: false,
        hasTabs: true,
        tabs: ['/pages/api-inventory/group', '/pages/api-inventory/api']
      },
      {
        title: 'TestCase Inventory',
        link: '',
        icon: 'card_travel',
        active: false,
        children: [
          {
            title: 'TestCase Detail',
            link: '/pages/testcase-inventory/test-set',
            icon: 'cast',
            active: false,
            hasTabs: true,
            tabs: ['/pages/testcase-inventory/test-set', '#pages/testcase-inventory/testsuite',
            '/pages/testcase-inventory/testgroup', '/pages/testcase-inventory/testcase']
          },
          {
            title: 'Test Group Analysis',
            link: '/pages/dashboard/tc-analysis',
            icon: 'bar_chart',
          },
        ],
      },
    ],
  },
  {
    title: 'Test Bed',
    icon: 'layers',
    link: '/pages/test-bed/network-element',
    active: false,
    hasTabs: true,
    tabs: ['/pages/test-bed/testbed-profile', '/pages/test-bed/view', '/pages/test-bed/network-element']
  },
  {
    title: 'Reservation',
    icon: 'shopping_cart',
    link: '',
    active: false,
    children: [
      {
        title: 'Manual Reservation',
        link: '/pages/reserve/device',
        icon: 'calendar_today',
        active: false,
        hasTabs: true,
        tabs: ['/pages/reserve/device', '/pages/reserve/testbed']
      },
      {
        title: 'View Reservation',
        link: '/pages/reserve/view',
        icon: 'collections_bookmark',
        active: false
      },
      {
        title: 'Reservation Analysis',
        link: '/pages/dashboard/reservation-analysis',
        icon: 'pie_chart',
      },
    ],
  },
  {
    title: 'Regression',
    icon: 'list_alt',
    link: '',
    active: false,
    children: [
    {
      title: 'View Regression',
      link: '/pages/regression/list',
      icon: 'list',
      active: false
    },
    {
      title: 'Regression Result Analysis',
      link: '/pages/regression/analysis',
      icon: 'playlist_add_check',
      active: false
    }
    ]
  },
  {
    title: 'Settings',
    icon: 'settings',
    link: 'pages/settings',
    active: false,
    children: [
      {
        title: 'User View',
        link: '/pages/settings/user/view',
        icon: 'person',

      },
      {
        title: 'Team View',
        link: '/pages/settings/team/view',
        icon: 'people',
        // children: [
        //   {
        //     title: 'Add',
        //     link: '/pages/settings/team/add',
        //     icon: 'plus-circle'
        //   },
        //   {
        //     title: 'View',
        //     link: '/pages/settings/team/view',
        //     icon: 'menu-2'
        //   },
        // ],
      },
      {
        title: 'All Feedback',
        link: '/pages/settings/feedback/view',
        icon: 'message_square',
      },
      {
        title: 'Vendor List',
        link: '/pages/settings/vendorName',
        icon: 'widgets',
      }
       ,
      {
        title: 'System Config',
        link: '/pages/settings/system/configuration',
        icon: 'settings',
      },
      {
        title: 'Login-out Analysis',
        link: '/pages/settings/user/loginlogoutAnalysis',
        icon: 'bubble_chart',
      }
      // {
      //   title: 'DB Management',
      //   link: '/pages/settings/dbManagement',
      //   icon: 'layout',
      // }

      // ,
      // {
      //   title: 'About Config',
      //   link: '/pages/settings/about/view',
      //   icon: 'question-mark-circle',
      // }
    ],
  },
  {
    title: 'Server Monitor Page',
    icon: 'network_check',
    link: '/pages/dashboard/hygiene-charts',
    active: false,
  },
  {
    title: 'About Us',
    icon: 'people',
    link: '/pages/about-us',
    active: false,
  },
];

export const LEAD_MENU_ITEMS = [
  {
    title: 'Dashboard',
    icon: 'home',
    link: '/pages/dashboard',
    active: true,
    home: true,
  },
  {
    title: 'Test Scheduler',
    icon: 'timeline',
    link: '',
    active: false,
    children: [
      {
        title: 'Scheduler',
        link: '/pages/test-scheduler/configure',
        icon: 'date_range',
      },
      {
        title: 'Quick Scheduler',
        link: '/pages/test-scheduler/quickScheduler',
        icon: 'schedule',
      },
      {
        title: 'Auto Regression',
        link: '/pages/test-scheduler/autoRegression',
        icon: 'update',
      },
      {
        title: 'Dynamic Scheduler',
        link: '/pages/test-scheduler/dynamicScheduler',
        icon: 'dynamic_feed',
      }
    ],
  },
  {
    title: 'Lab View',
    icon: 'dashboard',
    link: '/pages/lab-setup',
    active: false,
  },
  {
    title: 'Inventory',
    icon: 'lan',
    link: '',
    active: false,
    children: [
      {
        title: 'Device Inventory',
        link: '/pages/device-inventory/device-variables',
        icon: 'smartphone',
        active: false,
        hasTabs: true,
        tabs: ['/pages/device-inventory/device-variables', '/pages/device-inventory/device-profile',
        '/pages/device-inventory/vendor-model', '/pages/device-inventory/device']
      },
      {
        title: 'API Inventory',
        link: '/pages/api-inventory/group',
        icon: 'link',
        active: false,
        hasTabs: true,
        tabs: ['/pages/api-inventory/group', '/pages/api-inventory/api']
      },
      {
        title: 'TestCase Inventory',
        link: '',
        icon: 'card_travel',
        active: false,
        children: [
          {
            title: 'TestCase Detail',
            link: '/pages/testcase-inventory/test-set',
            icon: 'cast',
            active: false,
            hasTabs: true,
            tabs: ['/pages/testcase-inventory/test-set', '#pages/testcase-inventory/testsuite',
            '/pages/testcase-inventory/testgroup', '/pages/testcase-inventory/testcase']
          },
          {
            title: 'Test Group Analysis',
            link: '/pages/dashboard/tc-analysis',
            icon: 'bar_chart',
          },
        ],
      },
    ],
  },
  {
    title: 'Test Bed',
    icon: 'layers',
    link: '/pages/test-bed/network-element',
    active: false,

  },
  {
    title: 'Reservation',
    icon: 'shopping_cart',
    link: '',
    active: false,
    children: [
      {
        title: 'Manual Reservation',
        link: '/pages/reserve/device',
        icon: 'calendar_today',
        active: false,
        hasTabs: true,
        tabs: ['/pages/reserve/device', '/pages/reserve/testbed']
      },
      {
        title: 'View Reservation',
        link: '/pages/reserve/view',
        icon: 'collections_bookmark',
        active: false
      },
      {
        title: 'Reservation Analysis',
        link: '/pages/dashboard/reservation-analysis',
        icon: 'pie_chart',
      },
    ],
  },
  {
    title: 'Regression',
    icon: 'list_alt',
    link: '',
    active: false,
    children: [
    {
      title: 'View Regression',
      link: '/pages/regression/list',
      icon: 'list',
      active: false
    },
    {
      title: 'Regression Result Analysis',
      link: '/pages/regression/analysis',
      icon: 'playlist_add_check',
      active: false
    }
    ]
  },
  {
    title: 'Settings',
    icon: 'settings',
    link: 'pages/settings',
    active: false,
    children: [
      {
        title: 'User View',
        link: '/pages/settings/user/view',
        icon: 'person',

      },
      {
        title: 'Team View',
        link: '/pages/settings/team/view',
        icon: 'people',
      },
      {
        title: 'All Feedback',
        link: '/pages/settings/feedback/view',
        icon: 'message_square',
      },
      {
        title: 'System Config',
        link: '/pages/settings/system/configuration',
        icon: 'settings',
      }
    ],
  },
  {
    title: 'Server Monitor Page',
    icon: 'network_check',
    link: '/pages/dashboard/hygiene-charts',
    active: false,
  },
  {
    title: 'About Us',
    icon: 'people',
    link: '/pages/about-us',
    active: false,

  },
];

export const USER_MENU_ITEMS = [
  {
    title: 'Dashboard',
    icon: 'home',
    link: '/pages/dashboard',
    active: true,
    home: true,
  },
  {
    title: 'Test Scheduler',
    icon: 'timeline',
    link: '',
    active: false,
    children: [
      {
        title: 'Scheduler',
        link: '/pages/test-scheduler/configure',
        icon: 'date_range',
      },
      {
        title: 'Quick Scheduler',
        link: '/pages/test-scheduler/quickScheduler',
        icon: 'schedule',
      },
      {
        title: 'Auto Regression',
        link: '/pages/test-scheduler/autoRegression',
        icon: 'update',
      },
      {
        title: 'Dynamic Scheduler',
        link: '/pages/test-scheduler/dynamicScheduler',
        icon: 'dynamic_feed',
      }
    ],
  },
  {
    title: 'Lab View',
    icon: 'dashboard',
    link: '/pages/lab-setup',
    active: false,

  },
  {
    title: 'Inventory',
    icon: 'lan',
    link: 'pages/inventory',
    active: false,
    children: [
      {
        title: 'Device Inventory',
        link: '/pages/device-inventory/device-variables',
        icon: 'smartphone',
        active: false,
        hasTabs: true,
        tabs: ['/pages/device-inventory/device-variables', '/pages/device-inventory/device-profile',
        '/pages/device-inventory/vendor-model', '/pages/device-inventory/device']
      },
      {
        title: 'API Inventory',
        link: '/pages/api-inventory/group',
        icon: 'link',
        active: false,
        hasTabs: true,
        tabs: ['/pages/api-inventory/group', '/pages/api-inventory/api']
      },
      {
        title: 'TestCase Inventory',
        link: '',
        icon: 'card_travel',
        active: false,
        children: [
          {
            title: 'TestCase Detail',
            link: '/pages/testcase-inventory/test-set',
            icon: 'cast',
            active: false,
            hasTabs: true,
            tabs: ['/pages/testcase-inventory/test-set', '#pages/testcase-inventory/testsuite',
            '/pages/testcase-inventory/testgroup', '/pages/testcase-inventory/testcase']
          },
          {
            title: 'Test Group Analysis',
            link: '/pages/dashboard/tc-analysis',
            icon: 'bar_chart',
          },
        ],
      }
    ],
  },
  {
    title: 'Test Bed',
    icon: 'layers',
    link: '/pages/test-bed/network-element',
    active: false,

  },
  {
    title: 'Reservation',
    icon: 'shopping_cart',
    link: '',
    active: false,
    children: [
      {
        title: 'Manual Reservation',
        link: '/pages/reserve/device',
        icon: 'calendar_today',
        active: false,
        hasTabs: true,
        tabs: ['/pages/reserve/device', '/pages/reserve/testbed']
      },
      {
        title: 'View Reservation',
        link: '/pages/reserve/view',
        icon: 'collections_bookmark',
        active: false
      },
      {
        title: 'Reservation Analysis',
        link: '/pages/dashboard/reservation-analysis',
        icon: 'pie_chart',
        active: false,
        hasTabs: false,
        tabs: null
      },
    ],
  },
  {
    title: 'Regression',
    icon: 'list_alt',
    link: '',
    active: false,
    children: [
    {
      title: 'View Regression',
      link: '/pages/regression/list',
      icon: 'list',
      active: false
    },
    {
      title: 'Regression Result Analysis',
      link: '/pages/regression/analysis',
      icon: 'playlist_add_check',
      active: false
    }
    ]
  },
  {
        title: 'All Feedback',
        icon: 'star',
        link: '/pages/userSetting/feedback/view',
        active: false,

      },
      {
        title: 'Server Monitor Page',
        icon: 'network_check',
        link: '/pages/dashboard/hygiene-charts',
        active: false,
      },
  {
    title: 'About Us',
    icon: 'people',
    link: '/pages/about-us',
    active: false,

  },
];
