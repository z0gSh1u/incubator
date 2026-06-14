#include <iostream>
#include <fstream>
#include <string>
#include <map>
#include <cstdlib>

using namespace std;

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

bool isWord(string a)
{
	// pure sign is not word
	if (a.size() == 1 && isSign(a[0]))
		return false;

	// pure number is not word
	// 30% 60- is not word either
	bool isPureNum = true;
	for (auto i = a.begin(); i != a.end(); i++)
		if (!isdigit((*i)) && (!isSign((*i))))
		{ isPureNum = false; break; }
	if (isPureNum) return false;

	// else is word
	return true;
}

string clearSign(string a)
{
	string res = "";
	for (auto i = a.begin(); i != a.end(); i++)
		if ( !isSign((*i)) )
			res += (*i);
	return res;
}

string toLower(string a)
{
	string r = a;
	for (auto i = r.begin(); i != r.end(); i++)
	{
		if ( (*i) >= 'A' && (*i) <= 'Z' )
			(*i) += 'a' - 'A';
	}
	return r;
}

string proc(string a)
{
	string r = a;
	r = clearSign(r);
	r = toLower(r);
	return r;
}

map<string, int> wordFreq(const char* fileName)
{
	ifstream f;
	f.open(fileName, ios::in);

	if (!f.is_open())
		throw "FAILED TO OPEN FILE";

	string token;
	map<string, int> res;
	while (!f.eof())
	{
		f >> token;
		if (isWord(token) && token != "")
		{
			token = proc(token);
			if (res.count(token))
				res.at(token)++;
			else
				res.insert(pair<string, int>(token, 1));
		}
	}
	return res;
}

void calculate(map<string, int>& a)
{
	cout << "=== Word Freq Data ===" << endl;
	for (auto i = a.begin(); i != a.end(); i++)
		cout << i->first << ": " << i->second << endl;
}

int main()
{
	auto res = wordFreq("obama.txt");
	calculate(res);

	system("pause");
	return 0;
}