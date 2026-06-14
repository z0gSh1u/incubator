#include <iostream>
#include <string>
#include <sstream>
#include <cstdlib>

using namespace std;

#define MAXTIME 50

class Polynomial
{
private:
	int term[MAXTIME];	// term[exp] = coe

	bool issign(char a)
	{
		if (a == '+' || a == '-')
			return true;
		else return false;
	}

public:
	Polynomial()
	{
		for (int i = 0; i < MAXTIME; i++)
			term[i] = 0;
	}

	void setPolynomial(string s)
	{
		/* 3x^3 + 2x^2 + x + 7
		   things between two sign (+/-) is a term
		   Pre-process to make " + ... + " for every term */
		if (s[0] != '-') s = '+' + s;
		s = s + '+';
		// clear all spaces
		int spaceBegin = s.find(" ");
		while (spaceBegin != -1)
		{
			s.replace(spaceBegin, 1, "");
			spaceBegin = s.find(" ", spaceBegin);
		}
		// now as +3x^3+2x^2+x+7+
		int coe, exp, head = 0, tail, sgn;
		for (int i = head; ; i++)
		{
			if (head == s.size() - 1)
				break;
			// find tail
			for (int j = head + 1; ; j++)
				if (issign(s[j])) { tail = j; break; }
			/* +3x^3+
			   ^    ^
			   |    |
			   h    t */
			// process s[head, tail)
			// 1 - determine sign
			if (s[head] == '+') sgn = 1; else sgn = -1;
			// 2 - determine exp
			string todo = s.substr(head + 1, tail - 1);
			if (todo[0] == 'x') todo = '1' + todo;
			// 3x^3  || 3x  ||  3 || -x^3 || x^3
			bool hasExp = false, hasX = false;
			for (int i = 0; i <= todo.size() - 1; i++)
			{
				if (todo[i] == 'x') { hasX = true; todo[i] = ' '; }
				if (todo[i] == '^') { hasExp = true; todo[i] = ' '; }
			}
			stringstream ss;
			ss.str(todo);

			if (hasX && hasExp)
			// 3 3
			{
				ss >> coe;
				ss >> exp;
			}
			else if ( hasX && (!hasExp) )
			// 3
			{
				ss >> coe;
				exp = 1;
			}
			else if ( (!hasX) && (!hasExp) )
			// 3
			{
				ss >> coe;
				exp = 0;
			}
			term[exp] += coe * sgn;
			head = tail;
			i = head;
		}
	}

	string getPolynomial()
	{
		ostringstream ss;
		bool pass1 = false;
		for (int i = MAXTIME - 1; i >= 0; i--)
			if (term[i] != 0)
			{
				if (term[i] > 0 && pass1) ss << '+';
				if (term[i] != 1 && term[i] != -1) ss << term[i];
				if (term[i] == -1) ss << '-';
				if (i == 0 && (term[i] == -1 || term[i] == 1)) ss << '1';
				if (i == 1) ss << 'x';
				else if (i != 0) ss << "x^";
				if (i != 1 && i != 0) ss << i;
				pass1 = true;
			}
		string res = ss.str();
		return res;
	}

	Polynomial add(Polynomial &a)
	{
		Polynomial res;
		for (int i = 0; i <= MAXTIME - 1; i++)
			res.term[i] = this->term[i] + a.term[i];
		return res;
	}

	Polynomial subtract(Polynomial &a)
	{
		Polynomial res;
		for (int i = 0; i <= MAXTIME - 1; i++)
			res.term[i] = this->term[i] - a.term[i];
		return res;
	}

	void give(Polynomial &a)
	{
		for (int i = 0; i <= MAXTIME - 1; i++)
			this->term[i] = a.term[i];
	}

	Polynomial multiply (Polynomial &a)
	{
		Polynomial res;
		for (int i = 0; i <= MAXTIME - 1; i++)
			for (int j = 0; j <= MAXTIME - 1; j++)
			{
				if (this->term[i] == 0 || a.term[j] == 0) 
					continue;
				if (i + j <= MAXTIME - 1)
					res.term[i+j] = this->term[i] * a.term[j];
			}
		return res;
	}

	Polynomial operator + (Polynomial &a)
	{ return this->add(a);		}

	Polynomial operator - (Polynomial &a)
	{ return this->subtract(a); }

	void operator = (Polynomial &a)
	{ this->give(a);			}

	Polynomial operator * (Polynomial &a)
	{ return this->multiply(a);	}

	Polynomial& operator += (Polynomial &a)
	{
		(*this) = (*this) + a;
		return (*this);
	}

	Polynomial& operator -= (Polynomial &a)
	{
		(*this) = (*this) - a;
		return (*this);
	}

	Polynomial& operator *= (Polynomial &a)
	{
		(*this) = (*this) * a;
		return (*this);
	}

};

int main()
{
	Polynomial a, b;
	a.setPolynomial("x^2+2x+1");
	b.setPolynomial("x");
	Polynomial res;

	Polynomial c, d;
	c.setPolynomial("3x^4+2x^3+9x+5");
	d.setPolynomial("7x^3-3x-2");

	res = a * b;
	cout << res.getPolynomial();

	cout << endl;

	res = c + d;
	cout << res.getPolynomial();

	system("pause");
	return 0;
}