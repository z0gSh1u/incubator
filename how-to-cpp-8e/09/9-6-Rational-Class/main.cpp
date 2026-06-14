#include <iostream>
#include <stdexcept>
#include <cstdlib>

using namespace std;

int GCD(int a, int b)
{
	if (a<b) { int t=a; a=b; b=t; }
	int mod;
	while (1)
	{
		mod=a%b;
		if (mod==0) return b;
		a=b; b=mod;
	}
}

class Rational
{
private:
	int numerator, denominator;

public:
	Rational(int numerator=1, int denominator=1)
	{
		if (denominator==0)
			throw invalid_argument("Denominator can't be zero!");
		this->numerator=numerator;
		this->denominator=denominator;
		*this=reduce(*this);
	}

	Rational reduce(Rational a)
	{
		int ndGCD=GCD(numerator,denominator);
		a.numerator/=ndGCD;
		a.denominator/=ndGCD;
		return a;
	}

	Rational add(Rational a)
	{
		int publicDeno=this->denominator*a.denominator;
		Rational t( (this->numerator*(publicDeno/this->denominator)+(a.numerator*(publicDeno/a.denominator)) ), publicDeno );
		return reduce(t);
	}

	Rational subtract(Rational a)
	{
		int publicDeno=this->denominator*a.denominator;
		Rational t( (this->numerator*(publicDeno/this->denominator)-(a.numerator*(publicDeno/a.denominator)) ), publicDeno );
		return reduce(t);
	}

	Rational multiply(Rational a)
	{
		return
			reduce(Rational
			(a.numerator*this->numerator,
			a.denominator*this->denominator));
	}

	Rational divide(Rational a)
	{
		Rational b(a.denominator,a.numerator);
		return
			this->multiply(b);
	}

	void print_1()
	{
		if (denominator<0) cout << '-';
		cout << numerator << " / " << (denominator<0 ? -denominator : denominator) << endl;
	}

	void print_2()
	{
		cout << numerator*1.0/denominator << endl;
	}

	// More:
	Rational operator+ (const Rational &a)
	{
		return this->add(a);
	}

	Rational operator- (const Rational &a)
	{
		return this->subtract(a);
	}

	Rational operator* (const Rational &a)
	{
		return this->multiply(a);
	}

	Rational operator/ (const Rational &a)
	{
		return this->divide(a);
	}
};

int main()
{
	Rational a(-6,9);
	Rational b(5,3);
	
	a.add(b);

	system("pause");
	return 0;
}