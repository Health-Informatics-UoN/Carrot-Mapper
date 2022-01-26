import axios from 'axios';
const authToken = window.a
const api = window.u+'api'

export const downloadXLSXFile = async () => {
    
    const url= api+'/scanreports/'+window.scan_report+'/download/';
    const headers = {'Content-Type': 'blob',Authorization: "Token "+authToken};
    const config = {method: 'GET', url: url, responseType: 'blob', headers};

    try {
        const response = await axios(config);
        console.log(response.data);
        const outputFilename = window.scan_report_name;
        // If you want to download file automatically using link attribute.
        const url = URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', outputFilename);
        document.body.appendChild(link);
        link.click();

    } catch (error) {
        throw Error(error);
    }
}

