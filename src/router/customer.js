import CustomerList from "@/views/customer/CustomerList.vue";
import CustomerGrade from "@/views/customer/CustomerGrade.vue";
import CustomerInquiry from "@/views/customer/CustomerInquiry.vue";
import CustomerNoti from "@/views/customer/CustomerNoti.vue";
import CustomerHome from "@/views/customer/CustomerHome.vue";
import CustomerCommonDetail from "@/views/customer/CustomerCommonDetail.vue";
import CustomerDetailComponent from "@/components/Customer/CustomerDetailComponent.vue";

export default [
    {
        path: '/customer',
        component: CustomerHome,
        children: [
            {
                path: 'list',
                component: CustomerList
            },
            {
                path: ':customerCode',
                component: CustomerCommonDetail,
                children: [
                    {
                        path: 'basicInfo',
                        component: CustomerDetailComponent
                    }, 
                    {
                        path: 'purchaseHistory',
                        component: () => import('@/components/Customer/CustomerPurchaseComponent.vue')
                    }
                ]
            },
            {
                path: 'grade',
                component: CustomerGrade
            },
            {
                path: 'inquiry',
                component: CustomerInquiry
            },
            {
                path: "noti",
                component: CustomerNoti
            }
        ]
    }

];