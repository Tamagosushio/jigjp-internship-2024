import re
p = re.compile("[\u30A1-\u30FF]+")

words = []
with open("./BCCWJ_frequencylist_luw_ver1_0.tsv") as f:
    lines = f.readlines()
    for line in lines:
        elements = line.split("\t")
        if("名詞-普通名詞" in elements[3] or "名詞-固有名詞" in elements[3]):
            if(p.fullmatch(elements[1])):
                words.append([elements[1], elements[2]])
words.sort()
for l in words:
    print(f"{l[1]},{l[0]}")
        
    
