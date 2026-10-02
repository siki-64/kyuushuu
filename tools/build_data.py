#!/usr/bin/env python3
"""Generate data/n*.json from the compact word lists below.

Format per line: english[,alt english] | kanji form | kana | romaji
The first English gloss also gets rough -s/-ed inflections in the content
script, so keep it a plain, unambiguous content word.
"""
import json, pathlib

LISTS = {
"n5": """
water|水|みず|mizu
fire|火|ひ|hi
mountain|山|やま|yama
river|川|かわ|kawa
tree|木|き|ki
flower|花|はな|hana
rain|雨|あめ|ame
snow|雪|ゆき|yuki
sky|空|そら|sora
sea,ocean|海|うみ|umi
dog|犬|いぬ|inu
cat|猫|ねこ|neko
fish|魚|さかな|sakana
bird|鳥|とり|tori
person,people|人|ひと|hito
friend|友達|ともだち|tomodachi
teacher|先生|せんせい|sensei
student|学生|がくせい|gakusei
child,children|子供|こども|kodomo
mother|母|はは|haha
father|父|ちち|chichi
family|家族|かぞく|kazoku
name|名前|なまえ|namae
house,home|家|いえ|ie
school|学校|がっこう|gakkou
station|駅|えき|eki
hospital|病院|びょういん|byouin
bank|銀行|ぎんこう|ginkou
shop,store|店|みせ|mise
restaurant|レストラン|れすとらん|resutoran
library|図書館|としょかん|toshokan
room|部屋|へや|heya
door|ドア|どあ|doa
window|窓|まど|mado
desk|机|つくえ|tsukue
chair|椅子|いす|isu
book|本|ほん|hon
newspaper|新聞|しんぶん|shinbun
letter|手紙|てがみ|tegami
picture,photo|写真|しゃしん|shashin
car|車|くるま|kuruma
train|電車|でんしゃ|densha
bus|バス|ばす|basu
bicycle,bike|自転車|じてんしゃ|jitensha
airplane|飛行機|ひこうき|hikouki
road,street|道|みち|michi
country|国|くに|kuni
city,town|町|まち|machi
money|お金|おかね|okane
food|食べ物|たべもの|tabemono
rice|ご飯|ごはん|gohan
meat|肉|にく|niku
egg|卵|たまご|tamago
vegetable|野菜|やさい|yasai
fruit|果物|くだもの|kudamono
milk|牛乳|ぎゅうにゅう|gyuunyuu
tea|お茶|おちゃ|ocha
coffee|コーヒー|こーひー|koohii
breakfast|朝ご飯|あさごはん|asagohan
lunch|昼ご飯|ひるごはん|hirugohan
dinner|晩ご飯|ばんごはん|bangohan
morning|朝|あさ|asa
night|夜|よる|yoru
evening|晩|ばん|ban
today|今日|きょう|kyou
tomorrow|明日|あした|ashita
yesterday|昨日|きのう|kinou
week|週|しゅう|shuu
month|月|つき|tsuki
year|年|とし|toshi
time|時間|じかん|jikan
weather|天気|てんき|tenki
eye|目|め|me
ear|耳|みみ|mimi
mouth|口|くち|kuchi
hand|手|て|te
foot,leg|足|あし|ashi
head|頭|あたま|atama
face|顔|かお|kao
body|体|からだ|karada
clothes|服|ふく|fuku
shoe|靴|くつ|kutsu
hat|帽子|ぼうし|boushi
umbrella|傘|かさ|kasa
word|言葉|ことば|kotoba
question|質問|しつもん|shitsumon
homework|宿題|しゅくだい|shukudai
music|音楽|おんがく|ongaku
song|歌|うた|uta
movie,film|映画|えいが|eiga
phone,telephone|電話|でんわ|denwa
key|鍵|かぎ|kagi
paper|紙|かみ|kami
pen|ペン|ぺん|pen
dictionary|辞書|じしょ|jisho
language|言語|げんご|gengo
japanese|日本語|にほんご|nihongo
english|英語|えいご|eigo
holiday,vacation|休み|やすみ|yasumi
eat|食べる|たべる|taberu
drink|飲む|のむ|nomu
walk|歩く|あるく|aruku
run|走る|はしる|hashiru
swim|泳ぐ|およぐ|oyogu
sleep|寝る|ねる|neru
read|読む|よむ|yomu
write|書く|かく|kaku
listen|聞く|きく|kiku
speak|話す|はなす|hanasu
buy|買う|かう|kau
sell|売る|うる|uru
open|開ける|あける|akeru
close|閉める|しめる|shimeru
wait|待つ|まつ|matsu
learn|習う|ならう|narau
teach|教える|おしえる|oshieru
forget|忘れる|わすれる|wasureru
remember|覚える|おぼえる|oboeru
play|遊ぶ|あそぶ|asobu
sing|歌う|うたう|utau
wash|洗う|あらう|arau
borrow|借りる|かりる|kariru
lend|貸す|かす|kasu
die|死ぬ|しぬ|shinu
cold|寒い|さむい|samui
hot|暑い|あつい|atsui
new|新しい|あたらしい|atarashii
old|古い|ふるい|furui
big,large|大きい|おおきい|ookii
small|小さい|ちいさい|chiisai
long|長い|ながい|nagai
short|短い|みじかい|mijikai
high,tall|高い|たかい|takai
cheap|安い|やすい|yasui
expensive|高い|たかい|takai
fast|速い|はやい|hayai
early|早い|はやい|hayai
slow|遅い|おそい|osoi
heavy|重い|おもい|omoi
lightweight|軽い|かるい|karui
easy|易しい|やさしい|yasashii
difficult|難しい|むずかしい|muzukashii
interesting|面白い|おもしろい|omoshiroi
delicious|美味しい|おいしい|oishii
busy|忙しい|いそがしい|isogashii
happy|嬉しい|うれしい|ureshii
sad|悲しい|かなしい|kanashii
beautiful|綺麗|きれい|kirei
quiet|静か|しずか|shizuka
famous|有名|ゆうめい|yuumei
healthy|元気|げんき|genki
red|赤い|あかい|akai
blue|青い|あおい|aoi
white|白い|しろい|shiroi
black|黒い|くろい|kuroi
""",
"n4": """
dream|夢|ゆめ|yume
heart|心|こころ|kokoro
voice|声|こえ|koe
sound|音|おと|oto
wind|風|かぜ|kaze
island|島|しま|shima
forest|森|もり|mori
moon|月|つき|tsuki
star|星|ほし|hoshi
sun|太陽|たいよう|taiyou
earthquake|地震|じしん|jishin
village|村|むら|mura
airport|空港|くうこう|kuukou
museum|博物館|はくぶつかん|hakubutsukan
church|教会|きょうかい|kyoukai
temple|お寺|おてら|otera
factory|工場|こうじょう|koujou
office|事務所|じむしょ|jimusho
company|会社|かいしゃ|kaisha
meeting|会議|かいぎ|kaigi
job,work|仕事|しごと|shigoto
plan|計画|けいかく|keikaku
problem|問題|もんだい|mondai
answer|答え|こたえ|kotae
reason|理由|りゆう|riyuu
example|例|れい|rei
culture|文化|ぶんか|bunka
history|歴史|れきし|rekishi
science|科学|かがく|kagaku
art|芸術|げいじゅつ|geijutsu
economy|経済|けいざい|keizai
politics|政治|せいじ|seiji
law|法律|ほうりつ|houritsu
rule|規則|きそく|kisoku
news|ニュース|にゅーす|nyuusu
information|情報|じょうほう|jouhou
computer|パソコン|ぱそこん|pasokon
program|番組|ばんぐみ|bangumi
game|ゲーム|げーむ|geemu
sport|スポーツ|すぽーつ|supootsu
gift,present|お土産|おみやげ|omiyage
price|値段|ねだん|nedan
medicine|薬|くすり|kusuri
doctor|医者|いしゃ|isha
nurse|看護師|かんごし|kangoshi
police|警察|けいさつ|keisatsu
husband|夫|おっと|otto
wife|妻|つま|tsuma
boyfriend|彼氏|かれし|kareshi
girlfriend|彼女|かのじょ|kanojo
baby|赤ちゃん|あかちゃん|akachan
guest|客|きゃく|kyaku
neighbor|隣人|りんじん|rinjin
glass|ガラス|がらす|garasu
mirror|鏡|かがみ|kagami
kitchen|台所|だいどころ|daidokoro
garden|庭|にわ|niwa
wall|壁|かべ|kabe
roof|屋根|やね|yane
stairs|階段|かいだん|kaidan
travel,trip|旅行|りょこう|ryokou
experience|経験|けいけん|keiken
memory|思い出|おもいで|omoide
smell|匂い|におい|nioi
taste|味|あじ|aji
color|色|いろ|iro
shape|形|かたち|katachi
size|大きさ|おおきさ|ookisa
war|戦争|せんそう|sensou
accident|事故|じこ|jiko
fail|失敗する|しっぱいする|shippai suru
decide|決める|きめる|kimeru
change|変える|かえる|kaeru
begin,start|始める|はじめる|hajimeru
finish|終わる|おわる|owaru
continue|続ける|つづける|tsuzukeru
believe|信じる|しんじる|shinjiru
think|思う|おもう|omou
understand|分かる|わかる|wakaru
explain|説明する|せつめいする|setsumei suru
prepare|準備する|じゅんびする|junbi suru
practice|練習する|れんしゅうする|renshuu suru
study|勉強する|べんきょうする|benkyou suru
cook|料理する|りょうりする|ryouri suru
clean|掃除する|そうじする|souji suru
build|建てる|たてる|tateru
break|壊す|こわす|kowasu
catch|捕まえる|つかまえる|tsukamaeru
throw|投げる|なげる|nageru
push|押す|おす|osu
pull|引く|ひく|hiku
choose|選ぶ|えらぶ|erabu
collect|集める|あつめる|atsumeru
search|探す|さがす|sagasu
invite|招待する|しょうたいする|shoutai suru
visit|訪ねる|たずねる|tazuneru
laugh|笑う|わらう|warau
cry|泣く|なく|naku
angry|怒る|おこる|okoru
dangerous|危ない|あぶない|abunai
safe|安全|あんぜん|anzen
strong|強い|つよい|tsuyoi
weak|弱い|よわい|yowai
deep|深い|ふかい|fukai
soft|柔らかい|やわらかい|yawarakai
hard|硬い|かたい|katai
kindness|親切|しんせつ|shinsetsu
important|大切|たいせつ|taisetsu
necessary|必要|ひつよう|hitsuyou
special|特別|とくべつ|tokubetsu
convenient|便利|べんり|benri
dirty|汚い|きたない|kitanai
strange|変|へん|hen
""",
"n3": """
environment|環境|かんきょう|kankyou
society|社会|しゃかい|shakai
government|政府|せいふ|seifu
population|人口|じんこう|jinkou
industry|産業|さんぎょう|sangyou
technology|技術|ぎじゅつ|gijutsu
research|研究|けんきゅう|kenkyuu
result|結果|けっか|kekka
effect|効果|こうか|kouka
cause|原因|げんいん|gen'in
purpose|目的|もくてき|mokuteki
opinion|意見|いけん|iken
habit|習慣|しゅうかん|shuukan
character,personality|性格|せいかく|seikaku
future|未来|みらい|mirai
past|過去|かこ|kako
situation|状況|じょうきょう|joukyou
condition|状態|じょうたい|joutai
energy|エネルギー|えねるぎー|enerugii
attention|注意|ちゅうい|chuui
advice|アドバイス|あどばいす|adobaisu
promise|約束|やくそく|yakusoku
success|成功|せいこう|seikou
effort|努力|どりょく|doryoku
victory|勝利|しょうり|shouri
freedom|自由|じゆう|jiyuu
peace|平和|へいわ|heiwa
nature|自然|しぜん|shizen
universe|宇宙|うちゅう|uchuu
planet|惑星|わくせい|wakusei
customer|顧客|こきゃく|kokyaku
salary|給料|きゅうりょう|kyuuryou
contract|契約|けいやく|keiyaku
election|選挙|せんきょ|senkyo
increase|増える|ふえる|fueru
decrease|減る|へる|heru
compare|比べる|くらべる|kuraberu
protect|守る|まもる|mamoru
develop|発展する|はってんする|hatten suru
improve|改善する|かいぜんする|kaizen suru
support|支える|ささえる|sasaeru
suggest|提案する|ていあんする|teian suru
avoid|避ける|さける|sakeru
discover|発見する|はっけんする|hakken suru
imagine|想像する|そうぞうする|souzou suru
apologize|謝る|あやまる|ayamaru
complain|文句を言う|もんくをいう|monku wo iu
recently|最近|さいきん|saikin
probably|多分|たぶん|tabun
suddenly|突然|とつぜん|totsuzen
honest|正直|しょうじき|shoujiki
serious|真剣|しんけん|shinken
popular|人気|にんき|ninki
modern|現代的|げんだいてき|gendaiteki
traditional|伝統的|でんとうてき|dentouteki
""",
"n2": """
evidence|証拠|しょうこ|shouko
debate|討論|とうろん|touron
policy|政策|せいさく|seisaku
budget|予算|よさん|yosan
profit|利益|りえき|rieki
investment|投資|とうし|toushi
crisis|危機|きき|kiki
disaster|災害|さいがい|saigai
pollution|汚染|おせん|osen
resource|資源|しげん|shigen
analysis|分析|ぶんせき|bunseki
theory|理論|りろん|riron
hypothesis|仮説|かせつ|kasetsu
phenomenon|現象|げんしょう|genshou
tendency|傾向|けいこう|keikou
responsibility|責任|せきにん|sekinin
authority|権威|けんい|ken'i
negotiation|交渉|こうしょう|koushou
agreement|合意|ごうい|goui
criticism|批判|ひはん|hihan
reputation|評判|ひょうばん|hyouban
privacy|プライバシー|ぷらいばしー|puraibashii
architecture|建築|けんちく|kenchiku
literature|文学|ぶんがく|bungaku
philosophy|哲学|てつがく|tetsugaku
estimate|見積もる|みつもる|mitsumoru
emphasize|強調する|きょうちょうする|kyouchou suru
investigate|調査する|ちょうさする|chousa suru
cooperate|協力する|きょうりょくする|kyouryoku suru
hesitate|ためらう|ためらう|tamerau
abandon|捨てる|すてる|suteru
obvious|明らか|あきらか|akiraka
efficient|効率的|こうりつてき|kouritsuteki
flexible|柔軟|じゅうなん|juunan
temporary|一時的|いちじてき|ichijiteki
abstract|抽象的|ちゅうしょうてき|chuushouteki
""",
"n1": """
sovereignty|主権|しゅけん|shuken
bureaucracy|官僚制|かんりょうせい|kanryousei
diplomacy|外交|がいこう|gaikou
legislation|立法|りっぽう|rippou
inflation|インフレ|いんふれ|infure
recession|不況|ふきょう|fukyou
subsidy|補助金|ほじょきん|hojokin
consensus|合意形成|ごういけいせい|goui keisei
paradigm|枠組み|わくぐみ|wakugumi
dilemma|板挟み|いたばさみ|itabasami
prejudice|偏見|へんけん|henken
integrity|誠実さ|せいじつさ|seijitsusa
nostalgia|郷愁|きょうしゅう|kyoushuu
melancholy|憂鬱|ゆううつ|yuuutsu
ambiguity|曖昧さ|あいまいさ|aimaisa
vulnerability|脆弱性|ぜいじゃくせい|zeijakusei
compromise|妥協|だきょう|dakyou
infrastructure|基盤|きばん|kiban
manuscript|原稿|げんこう|genkou
artisan|職人|しょくにん|shokunin
contemplate|熟考する|じゅっこうする|jukkou suru
scrutinize|精査する|せいさする|seisa suru
undermine|損なう|そこなう|sokonau
alleviate|和らげる|やわらげる|yawarageru
meticulous|几帳面|きちょうめん|kichoumen
eloquent|雄弁|ゆうべん|yuuben
inevitable|必然的|ひつぜんてき|hitsuzenteki
profound|深遠|しんえん|shin'en
""",
}

out_dir = pathlib.Path(__file__).resolve().parent.parent / "data"
seen_en = {}
for level, block in LISTS.items():
    entries = []
    for line in block.strip().splitlines():
        en, ja, kana, romaji = [p.strip() for p in line.split("|")]
        glosses = [g.strip() for g in en.split(",")]
        for g in glosses:
            if g in seen_en:
                raise SystemExit(f"duplicate English gloss {g!r} in {level} (also {seen_en[g]})")
            seen_en[g] = level
        entries.append({"en": glosses, "ja": ja, "kana": kana, "romaji": romaji})
    (out_dir / f"{level}.json").write_text(json.dumps(entries, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(level, len(entries))
