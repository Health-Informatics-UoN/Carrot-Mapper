using System;
using System.Text;
using Aspose.Cells;
namespace Xls_to_CSV
{
    class Program
    {
        static void Main(string[] args)
        {
            Aspose.Cells.Workbook workbook = new Aspose.Cells.Workbook("/Users/vasilikipanagi/Documents/data/Phenobase1.xlsx");
            for (int idx = 0; idx < workbook.Worksheets.Count; idx++)
            {
               
                Aspose.Cells.Worksheet worksheet =  workbook.Worksheets[idx];
                Workbook wkb = new Workbook();
                wkb.Worksheets.Clear();
                Worksheet ws = wkb.Worksheets[wkb.Worksheets.Add()];
                ws.Copy(worksheet);
                ws.Name = worksheet.Name;
                var name = worksheet.Name;
                wkb.Save("/Users/vasilikipanagi/Documents/data/" + name.ToString() + ".csv", Aspose.Cells.SaveFormat.CSV);


            }

        }
    }
}

