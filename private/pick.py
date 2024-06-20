
with open("./private/VDRJ_Ver1_1_Research_Top60894.csv") as f:
    lines = f.readlines()
    for line in lines:
        elements = line.split(",")
        if(elements[16] == "名詞-普通名詞-一般" and 
           not(elements[14] == "#N/A" or elements[14] == "＊" or elements[15] == "#N/A" or elements[15] == "0")):
            print(f"{elements[14]},{elements[15]}")

