#pragma once

#include <iostream>
#include <string>
#include <sstream>

using namespace std;

class Complex
{
private:
	double real;
	double imaginary;

public:
	Complex(double = 0.0, double = 0.0);
	Complex operator + (const Complex&) const;
	Complex operator - (const Complex&) const;

	// added functions
	friend ostream& operator << (ostream& os, Complex& a);
	friend istream& operator >> (istream& is, Complex& a);

	Complex operator * (const Complex& a) const
	{
		Complex res;
		// (a+bi)*(c+di) = ac - bd + adi + bci
		res.real = real*a.real - imaginary*a.imaginary;
		res.imaginary = real*a.imaginary + imaginary*a.real;
		return res;
	}

	bool operator == (const Complex& a) const
	{
		return ( (real == a.real) && (imaginary == a.imaginary) );
	}

	bool operator != (const Complex& a) const
	{
		return (!((*this)==a));
	}

};

inline ostream& operator << (ostream& os, Complex& a)
{
	os << a.real << " + " << a.imaginary << "i" << endl;
	return os;
}

inline istream& operator >> (istream& is, Complex& a)
{
	// 2+3i
	string t;
	getline(is, t);
	
	for (int i=0; ; i++)
		if (t[i] == '+') { t[i] = ' '; break; }
	t[t.size() - 1] = ' ';
	
	stringstream ss;
	ss.str(t);
	ss >> a.real >> a.imaginary;
	
	return is;
}
