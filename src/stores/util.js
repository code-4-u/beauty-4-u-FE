const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'N/A'; // 유효하지 않은 날짜일 경우 기본값
    }
    return date.toLocaleDateString(); // 원하는 형식으로 변환
};

export { formatDate };