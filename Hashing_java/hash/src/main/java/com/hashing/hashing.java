package com.hashing;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.Buffer;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.apache.commons.codec.digest.DigestUtils;



public class hashing {


    private static final String COMMA_DELIMITER = ",";

    public static void main(String[] args) throws IOException {
    // Get Working Directory
    System.out.println("Working Directory = " + System.getProperty("user.dir"));
    String directory=System.getProperty("user.dir");
    //Read CSV files in List
    BufferedReader br = new BufferedReader(new FileReader(directory+"/data/dataset_1.csv"));
    BufferedReader br2 = new BufferedReader(new FileReader(directory+"/data/dataset_2.csv"));
    anonymise(br);
    anonymise(br2);
   
    br.close();



    }
    public static void anonymise(BufferedReader br) throws IOException {
        List<List<String>> records = new ArrayList<>();

        String line;
        while ((line = br.readLine()) != null) {
    
            String[] values = line.split(COMMA_DELIMITER);
            records.add(Arrays.asList(values));
        }
        //Create a Secure random number generator for the salt
        SecureRandom random= new SecureRandom();
        byte salt[]= new byte[256];
        random.nextBytes(salt);
        //Print out salt for demo
        // String encoded= org.apache.commons.codec.binary.Base64.encodeBase64String(salt);
        // System.out.println(encoded);
        
        //For each record append salt to id and hash the resulting value
        for(int i=1;i<records.size(); i++){
            
            String element=records.get(i).get(0)+salt;
            //Use apache commons library for hashing the id
            String sha256hex=DigestUtils.sha256Hex(element);
    
            System.out.println(records.get(i).get(0));
            System.out.println(sha256hex);
    
        }
        
    }



}
