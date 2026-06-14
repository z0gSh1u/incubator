#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>

using namespace std;

#define PHINUM 14

const struct phiWord
{
	string phi;
	int point;
} phiWord[PHINUM] = 
{
  "giveaway",2,	"lukcy",1,		"winner",2,		"prize",2,	"click",3,
  "link",3,		"complete",1,	"enter",1,		"win",2,	"won",2,
  "receive",1,	"received",1,	"subscribe",2,	"subscribed",2
};

bool isSign(char a)
{
	return
	(
		a == '.' || a == ',' || a == '!' ||
		a == '?' || a == '/' || a == '-' ||
		a == '+' || a == '*' || a == '"' ||
		a == '\''|| a == ':' || a == ';' ||
		a == '<' || a == '>' || a == '~' ||
		a == '`' || a == '#' || a == '$' ||
		a == '%' || a == '&' || a == '^' ||
		a == '#' || a == '@' || a == '_' ||
		a == '[' || a == ']' || a == '{' ||
		a == '}' || a == '(' || a == ')' ||
		a == '|'
	);
}

string toLower(string& a)
{
	string r = a;
	for (auto i = r.begin(); i != r.end(); i++)
		if ( (*i) >= 'A' && (*i) <= 'Z' )
			(*i) += 'a' - 'A';
	return r;
}

string clearSign(string& a)
{
	string res = "";
	for (auto i = a.begin(); i != a.end(); i++)
		if ( !isSign((*i)) )
			res += (*i);
	return res;
}

int scan(char* const fileName)
{
	// load phi.txt
	ifstream phi;
	phi.open(fileName, ios::in);
	if (!phi.is_open())
		throw "FILE OPEN FAILED";
	cout << "FILE " << fileName << " OPEN SUCCESSFULLY" << endl;

	// scan phi.txt
	int tot = 0;
	string word;
	while (!phi.eof())
	{
		phi >> word;
		for (int i = 0; i < PHINUM; i++)
			if (clearSign(toLower(word)) == phiWord[i].phi)
			{ tot += phiWord[i].point; break; };
	}
    
	// close and return
	phi.close();
	return tot;
}

int main()
{
	int a = scan("phi.txt");
	int b = scan("com.txt");

	cout << "POINTS OF PHI.TXT: " << a << endl;
	cout << "POINTS OF COM.TXT: " << b << endl;

	system("pause");
	return 0;
}