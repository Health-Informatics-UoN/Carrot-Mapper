using System;
using System.Text;
using Aspose.Cells;
namespace Xls_to_CSV
{
    class Program
    {
        static void Main(string[] args)
        {
            string filepath = "/Users/vasilikipanagi/Documents/data/Phenobase1.xlsx";
            string savepath = "/Users/vasilikipanagi/Documents/data/";
            Workbook workbook = new Workbook(filepath);
            for (int idx = 0; idx < workbook.Worksheets.Count; idx++)
            {

                Worksheet worksheet =  workbook.Worksheets[idx];
                Workbook wkb = new Workbook();
                wkb.Worksheets.Clear();
                Worksheet ws = wkb.Worksheets[wkb.Worksheets.Add()];
                ws.Copy(worksheet);
                ws.Name = worksheet.Name;
                var name = worksheet.Name;
                wkb.Save(savepath + name.ToString() + ".csv", SaveFormat.CSV);


            }

        }
    }
}
