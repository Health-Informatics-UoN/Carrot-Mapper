import axios from 'axios';

export const downloadXLSXFile = async (scanReportId, scanReportName) => {
    
    const url= '/api/scanreports/'+scanReportId+'/download/';
    const headers = {'Content-Type': 'blob'};
    const config = {method: 'GET', url: url, responseType: 'blob', headers};

    try {
        const response = await axios(config);
        console.log(response.data);
        const outputFilename = scanReportName;
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

