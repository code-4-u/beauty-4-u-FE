import {defineStore} from "pinia";
import {ref} from "vue";

const useCustomerStore = defineStore('customer', () => {

    const customerCode = ref(localStorage.getItem('customerCode') || '');
    const customerName = ref(localStorage.getItem('customerName') || '');
    const createdDate = ref(localStorage.getItem('createdDate') || '');
    const customerGrade = ref(localStorage.getItem('customerGrade') || '');

    const updateCustomerDetails = (code, name, date, grade) => {
        customerCode.value = code;
        customerName.value = name;
        createdDate.value = date;
        customerGrade.value = grade;

        localStorage.setItem('customerCode', code);
        localStorage.setItem('customerName', name);
        localStorage.setItem('createdDate', date);
        localStorage.setItem('customerGrade', grade);
    };

    return {
        customerCode,
        customerName,
        createdDate,
        customerGrade,
        updateCustomerDetails
    }
});

export {useCustomerStore};