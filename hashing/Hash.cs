using System.IO;
using System.Data;
using System;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Text;


namespace hashing
{
    class Hash
    {
        static void Main(string[] args)
        {
            string workingDirectory = Environment.CurrentDirectory;
            string projectDirectory = Directory.GetParent(workingDirectory).Parent.Parent.FullName;
            string path1 = Path.Combine(projectDirectory, @"data/dataset_1");
            string path2 = Path.Combine(projectDirectory, @"data/dataset_2");

            var reader = new StreamReader(path1 + ".csv");

            var reader2 = new StreamReader(path2 + ".csv");
            //Read in datasets
            //Print out datasets with hashed id
            DataTable table1 = anonymiseDataset(reader);


            foreach (DataRow dataRow in table1.Rows)
            {
                foreach (var item in dataRow.ItemArray)
                {
                    Console.WriteLine(item);
                }
            }
            DataTable table2 = anonymiseDataset(reader2);
            foreach (DataRow dataRow in table2.Rows)
            {
                foreach (var item in dataRow.ItemArray)
                {
                    Console.WriteLine(item);
                }
            }

        }
        public static DataTable anonymiseDataset(StreamReader reader)
        {
            DataTable dataTable = new DataTable();
            string[] headers = reader.ReadLine().Split(',');
            //Generate a salt for each dataset with a size of 256
            string salt = GenerateSalt(256);

            foreach (string header in headers)
            {
                dataTable.Columns.Add(header);
            }
            dataTable.Columns.Add(new DataColumn("sha256"));


            while (!reader.EndOfStream)
            {
                string[] rows = Regex.Split(reader.ReadLine(), ",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                DataRow dr = dataTable.NewRow();

                for (int i = 0; i < headers.Length; i++)
                {
                    dr[i] = rows[i];
                }
                dataTable.Rows.Add(dr);
                string hash = (string)dr["id"] + salt;


                foreach (DataRow row in dataTable.Rows)
                {
                    hash = ComputeSha256Hash(hash);
                    row["sha256"] = hash;
                }


            }
            Console.WriteLine("Start");
            return dataTable;

        }
        private static string GenerateSalt(int size)
        {
            //Generate a cryptographic random number.
            RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider();
            byte[] buff = new byte[size];
            rng.GetBytes(buff);

            // Return a Base64 string representation of the random number.
            return Convert.ToBase64String(buff);
        }
        static string ComputeSha256Hash(string data)
        {
            // Create a SHA256   
            using (SHA256 sha256Hash = SHA256.Create())
            {
                // ComputeHash - returns byte array  
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(data));

                // Convert byte array to a string   
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

    }
}
