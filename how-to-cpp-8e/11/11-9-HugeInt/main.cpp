#include <iostream>
#include <string>
#include <stdexcept>
#include <cstdlib>

#define MAXLEN 1000

using namespace std;

class HugeInt
{
	friend ostream& operator << (ostream& os, HugeInt& a);
	friend istream& operator >> (istream& is, HugeInt& a);

private:
	int bit[MAXLEN];	// +5678	--->	+8765
	int len;

	int compare(HugeInt& a)
	/*	return value:
		1	this > a
		0	this = a
	   -1	this < a  */
	{
		// postive > negative
		if (bit[0] > a.bit[0]) return 1;
		if (bit[0] < a.bit[0]) return -1;
		/* long postive > short postive
		   long negative < short negative */
		if (len > a.len) return (1*bit[0]);
		else if (len < a.len) return (-1*bit[0]);
		/* The rest: same len, same sign
		   Only need to compare abs val */
		for (int i = len; i >= 1; i--)
			if (bit[i] > a.bit[i]) return (1*bit[0]);
			else if (bit[i] < a.bit[i]) return (-1*bit[0]);
		// The rest: equal
		return 0;
	}

	HugeInt abs()
	// the absolute value of this
	{
		HugeInt res = (*this);
		res.bit[0] = 1;
		return res;
	}

	HugeInt oppo()
	// the opposite value of this
	{
		HugeInt res = (*this);
		res.bit[0] *= -1;
		return res;
	}

public:
	HugeInt()
	// construct the object and set it to 0
	{
		for (int i=0; i<=MAXLEN-1; i++)
			bit[i] = 0;
		len = 1;
		// we define 0 as +0
		bit[0] = 1;
	}

	void input(string number)
	// input a new number
	{
		// Pre-process the '+/-' sign
		if (number[0] == '-')	bit[0] = -1;
		else { bit[0] = 1; number = '+' + number; }
		// Reversed number set bit[1~...]
		int k = 1;
		for (int i = number.size() - 1; i >= 1; i--, k++)
			bit[k] = number[i] - '0';
		// Store the number's length excluding '+/-'
		len = number.size() - 1;
	}

	void output()
	// output the number
	{
		// Output the sign
		if (bit[0] == -1) cout << '-';
		// Output number part
		for (int i = len; i >= 1; i--)
			cout << bit[i];
	}

	// Start of a series of compare functions
	bool isEqualTo(HugeInt& a)				{return (!compare(a));}	// ==
	bool isNotEqualTo(HugeInt& a)			{return (compare(a));}	// !=
	bool isGreaterThan(HugeInt& a)			{return (compare(a)==1);}	// >
	bool isLessThan(HugeInt& a)				{return (compare(a)==-1);}	// <
	bool isGreaterThanOrEqualTo(HugeInt& a)	{return (compare(a)==1 || compare(a)==0);}	// >=
	bool isLessThanOrEqualTo(HugeInt& a)	{return (compare(a)==-1 || compare(a)==0);}	// <=
	bool isZero()
	{
		for (int i = len; i >= 1; i--)
			if (bit[i]) return false;
		return true;
	}
	// End of a series of compare functions

	HugeInt add(HugeInt& a)
	// add two same-sign numbers
	{
		// Pre-process " pos + neg "
		if (a.bit[0] == -1 && bit[0] == 1)
			return (*this).subtract(a.abs());
		// Pre-process " neg + pos "
		if (a.bit[0] == 1 && bit[0] == -1)
			return a.subtract((*this).abs());
		// Pre-process " this + 0 "
		if (a.isZero())	return (*this);
		// Pre-process " 0 + a "
		if ((*this).isZero()) return a;
		// The rest: same sign
		HugeInt res;
		// res's sign is same as this and a
		res.bit[0] = bit[0];
		// plus the number part
		int loopTime = (a.len > len ? a.len : len);
		res.len = loopTime;
		for (int i = 1; i <= loopTime; i++)
		{
			res.bit[i] += (bit[i] + a.bit[i]);
			if (res.bit[i] >= 10)
			{
				res.bit[i+1]++;
				res.bit[i] -= 10;
			}
		}
		// process xxxx9 + xxxx2 carryover
		if (res.bit[res.len+1]) res.len++;
		// return res
		return res;
	}
		
	HugeInt subtract(HugeInt& a)
	// subtract two same-sign numbers
	{
		// Pre-process " pos - neg "
		if (a.bit[0] == -1 && bit[0] == 1)
			return (*this).add(a.abs());
		/* Pre-process " neg - pos "
		   -3 - 5 = - (3 + 5)		*/
		if (a.bit[0] == 1 && bit[0] == -1)
			return ((((*this).abs()).add(a)).oppo());
		// Pre-process " this - 0 "
		if (a.isZero())	return (*this);
		// Pre-process " 0 - a "
		if ((*this).isZero()) return (a.oppo());
		// Pre-process 5-5 ; -5-(-5)
		HugeInt res;
		if (this->isEqualTo(a)) return res;
		/* The rest: pos1 - pos2 ; neg1 - neg2
		   set the sign	*/
		HugeInt p, q, r;
		p = (*this).abs();	q = a.abs();
		if (p.isGreaterThan(q)) res.bit[0] = 1*bit[0];
		else { res.bit[0] = -1*bit[0];	r = p; p = q; q = r; }
		// work out p-q postive subtract
		for (int i = 1; i <= p.len; i++)
		{
			res.bit[i] += p.bit[i] - q.bit[i];
			if (res.bit[i] < 0)
			{
				res.bit[i+1]--;
				res.bit[i] += 10;
			}
		}
		// re-calculate res's len
		for (int i = p.len; i >= 1; i--)
			if (res.bit[i]!=0) { res.len = i; break; };
		// return res
		return res;
	}

	HugeInt multiply(HugeInt& a)
	// multiply two numbers
	{
		HugeInt res;
		// Pre-process " what * 0 "
		if (this->isZero() || a.isZero()) return res;
		// determine sign
		res.bit[0] = bit[0] * a.bit[0];
		// multiply
		HugeInt p, q, r;
		p = (*this).abs();	q = a.abs();
		if (p.isLessThan(q))
		{ r = p; p = q; q = r; }
		// 5678 * 123
		for (int i = 1; i <= q.len; i++)
			for (int j = 1; j <= p.len; j++)
				res.bit[i+j-1] += p.bit[j] * q.bit[i]; 
		// carryover process
		for (int i = 1; i <= (p.len + q.len); i++)
			LABEL:
			if (res.bit[i] >= 10)
			{
				res.bit[i] -= 10;
				res.bit[i+1]++;
				goto LABEL;
			}
		// re-calculate res's len
		for (int i = (p.len + q.len); i >= 1; i--)
			if (res.bit[i]!=0) { res.len = i; break; };
		// return res
		return res;
	}

	HugeInt divide(HugeInt& a)
	// divide this by a ( int1 / int2 )
	{
		HugeInt zero;	zero.input("0");
		HugeInt one;	one.input("1");
		HugeInt ten;	ten.input("10");
		HugeInt res;
		// Pre-process " divide by zero "
		if (a.isZero())
			throw invalid_argument("Can't be divided by zero.");
		// Pre-process " 0 / what "
		if (this->isZero())		return zero;
		// Pre-process " short / long "
		if (this->len < a.len)	return zero;
		// Pre-process " 1 / 1 "
		if (this->isEqualTo(a)) return one;
		// The rest: long / short
		// perform division
		HugeInt p, q, r;
		p = (*this).abs(); q = a.abs();
		// 123456 / 12  -->  p/q
		// magnify q : 123456 - 12 0000
		int magnifyTime = p.len - q.len;
		while (1)
		{
			r = q;	HugeInt magnifyRate = one;
			for (int i = 1; i <= magnifyTime; i++)
			{
				r = r.multiply(ten);
				magnifyRate = magnifyRate.multiply(ten);
			}
			// keep subtracting
			while (1)
			{
				p = p.subtract(r);
				res = res.add(magnifyRate);
				if (p.isZero())
				{
					res.bit[0] = this->bit[0] * a.bit[0];
					return res;
				}
				if (p.isLessThan(zero))
				// too way subtract
				{
					// add one back
					p = p.add(r);
					res = res.subtract(magnifyRate);
					break;
				}
			}
			magnifyTime--;
			if (magnifyTime < 0) 
			{
				res.bit[0] = this->bit[0] * a.bit[0];
				return res;
			}
		}
	}

	HugeInt modulus(HugeInt& a)
	// modulus two numbers
	{
		HugeInt zero;
		HugeInt res;
		res = this->subtract((this->divide(a)).multiply(a));
		return res;
	}

	// Start of operator overloads
	HugeInt operator + (HugeInt& a)	{ return this->add(a);						}
	HugeInt operator - (HugeInt& a)	{ return this->subtract(a);					}
	HugeInt operator - ()			{ return this->oppo();						}	
	HugeInt operator * (HugeInt& a)	{ return this->multiply(a);					}
	HugeInt operator / (HugeInt& a)	{ return this->divide(a);					}
	HugeInt operator % (HugeInt& a)	{ return this->modulus(a);					}
	bool operator == (HugeInt& a)	{ return this->isEqualTo(a);				}
	bool operator != (HugeInt& a)	{ return this->isNotEqualTo(a);				}
	bool operator > (HugeInt& a)	{ return this->isGreaterThan(a);			}
	bool operator < (HugeInt& a)	{ return this->isLessThan(a);				}
	bool operator >= (HugeInt& a)	{ return this->isGreaterThanOrEqualTo(a);	}
	bool operator <= (HugeInt& a)	{ return this->isLessThanOrEqualTo(a);		}
	// End of operator overloads

	static HugeInt int_to_HugeInt(int a)
	// convert int to HugeInt
	{
		HugeInt res;
		if (a == 0) return res;
		if (a > 0) res.bit[0] = 1; 
		else { res.bit[0] = -1; a = -a; }
		int k = 1;
		while (a > 0)
		{
			res.bit[k++] = a % 10;
			a /= 10;
		}
		res.len = k - 1;
		return res;
	}

	static int HugeInt_to_int (HugeInt& a)
	// convert HugeInt to int
	{
		int k = 0;
		for (int i = a.len; i >= 1; i--)
		{
			k += a.bit[i];
			k *= 10;
		}
		k /= 10;
		k *= a.bit[0];
		return k;
	}

	HugeInt (int a)
	// to support (HugeInt)int
	{
		(*this) = int_to_HugeInt(a);
	}

	operator int ()
	// to support (int)HugeInt
	{
		return HugeInt_to_int(*this);
	}

};

ostream& operator << (ostream& os, HugeInt& a)
// to support cout << HugeInt
{
	a.output();
	return os;
}

istream& operator >> (istream& is, HugeInt& a)
// to support cin >> HugeInt
{
	string number;
	is >> number;
	a.input(number);
	return is;
}

int main()
{
	HugeInt a,b,c;
	a=-3;
	b=2;
	c=a+b;
	cout<<c;
	system("pause");
	return 0;
}