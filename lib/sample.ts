/** A fictional company used for the demo. Every person, address and number here is invented.
 *  The data contains deliberate mistakes so the checks have something to find. */
export const SAMPLE_COMPANY = "Northwind Labs Pvt Ltd (fictional)";

export const SAMPLE_PEOPLE = `name,email,title,department,location,role,manager_email,dept_manager
Arjun Mehta,arjun@northwind.example,CEO,Leadership,Bengaluru,Member,,
Priya Nair,priya@northwind.example,CFO,Finance,Bengaluru,Admin,arjun@northwind.example,
Rohan Iyer,rohan@northwind.example,Finance Controller,Finance,Bengaluru,Member,priya@northwind.example,
Kiran Rao,kiran@ca-partners.example,Chartered Accountant,Finance,Mumbai,External Accountant,priya@northwind.example,
Vikram Rao,vikram@northwind.example,Head of Engineering,Engineering,Bengaluru,Member,arjun@northwind.example,
Ananya Desai,ananya@northwind.example,Engineering Manager,Engineering,Bengaluru,Member,vikram@northwind.example,
Karthik S,karthik@northwind.example,Software Engineer,Engineering,Bengaluru,Member,ananya@northwind.example,
Divya Pillai,divya@northwind.example,Software Engineer,Engineering,Bengaluru,Member,ananya@northwind.example,
Imran Shaikh,imran@northwind.example,Software Engineer,Engineering,,Member,ananya@northwind.example,
Neha Gupta,neha@northwind.example,Software Engineer,Engineering,mumbai,Member,ananya@northwind.example,
Sanjay Malhotra,sanjay@northwind.example,VP Sales,Sales,Delhi,Member,arjun@northwind.example,
Pooja Bansal,pooja@northwind.example,Sales Manager,Sales,Delhi,Member,sanjay@northwind.example,
Rahul Verma,rahul@northwind.example,Account Executive,Sales,Delhi,Member,pooja@northwind.example,
Rahul Varma,rahul@northwind.example,Account Executive,Sales,Delhi,Member,pooja@northwind.example,
Meera Joshi,meera@northwind.example,Account Executive,Sales,Mumbai,Member,pooja@northwind.example,
Aditi Sharma,aditi@northwind.example,Head of Operations,Operations,Mumbai,Member,arjun@northwind.example,
Faisal Khan,faisal@northwind.example,Operations Executive,Operations,Mumbai,Member,aditi@northwind.example,
Aman Singh,aman@northwind.example,Support Lead,Operations,Delhi,Support Agent,aditi@northwind.example,
Tanvi Shah,tanvi@northwind.example,Marketing Executive,Marketing,Bengaluru,Member,ceo@northwind.example,
Dev Patel,dev@northwind.example,Content Lead,Marketing,Bengaluru,Member,ceo@northwind.example,
Nisha Reddy,nisha@northwind.example,HR Manager,People,Bengaluru,Member,arjun@northwind.example,`;

export const SAMPLE_POLICY = `Reimbursements: up to ₹5,000 manager approves; ₹5,000 to ₹50,000 finance controller; above ₹50,000 CFO.
Vendor bills: up to ₹25,000 auto-approved; ₹25,000 to ₹2 lakh finance controller then CFO; ₹2.5 lakh and above CFO then CEO.
Cards: new card requests above ₹1 lakh need the Head of Legal.`;

export const EMPTY_PEOPLE_TEMPLATE = `name,email,title,department,location,role,manager_email,dept_manager
`;
