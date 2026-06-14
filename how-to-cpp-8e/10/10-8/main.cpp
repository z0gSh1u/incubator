#include <iostream>
#include <vector>
#include <cstdlib>

using namespace std;

class IntegerSet
{
private:
	vector<bool> a;

public:
	IntegerSet()
	{
		a.resize(101, false);
	}

	IntegerSet(int k[], int size)
	{
		a.resize(101, false);
		for (int i=0; i<size; i++)
			this->a[k[i]] = true;
	}

	IntegerSet unionOfSets(IntegerSet a)
	{
		IntegerSet res;
		for (int i=0; i<=100; i++)
			if (this->a[i] || a.a[i])
				res.a[i] = true;
		return res;
	}

	IntegerSet intersectionOfSets(IntegerSet a)
	{
		IntegerSet res;
		for (int i=0; i<=100; i++)
			if (this->a[i] && a.a[i])
				res.a[i] = true;
		return res;
	}

	void insertElement(int k)
	{
		a[k] = true;
	}

	void deleteElement(int m)
	{
		a[m] = false;
	}

	void printSet()
	{
		for (int i=0; i<=100; i++)
			if (this->a[i])
				cout << i << " ";
	}

	bool isEqualTo(IntegerSet a)
	{
		for (int i=0; i<=100; i++)
			if (this->a[i] != a.a[i]) return false;
		return true;
	}

};

int main()
{
	IntegerSet a;
	a.insertElement(5);
	a.insertElement(23);
	a.printSet();

	cout << endl;

	int kk[10] = { 4,3,2,5,6,7,8,9,13, 66};
	IntegerSet b(kk, 10);
	b.printSet();
	cout << endl;

	IntegerSet a_u_b = a.unionOfSets(b);
	IntegerSet a_i_b = a.intersectionOfSets(b);
	a_u_b.printSet();
	cout << endl;
	a_i_b.printSet();
	cout << endl;

	system("pause");
	return 0;
}