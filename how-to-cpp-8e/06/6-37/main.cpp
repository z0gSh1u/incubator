#include <iostream>
#include <float.h>
#include <cstdlib>

using namespace std;

/* 
int fib_re(int n)
{
	if (n==1) return 0;
	if (n==2) return 1;
	return fib_re(n-1)+fib_re(n-2);
} 
*/

template <typename T> T fib_nonre(T n)
{
	T n1=0, n2=1;
	n--;
	for (int i=1; i<=n; i++)
    {
		T n2tmp = n2;
    	n2 = n1 + n2;
    	n1 = n2tmp;
    }
	return n2;
}

int main()
{
	for (int i=1; ;i++)
		if (fib_nonre(i)>0 && fib_nonre(i+1)<=0) 
		{ cout << "The maximum n when int is used is " << i << endl; break; }

	for (int i=1; ;i++)
		if (fib_nonre((double)i)<=DBL_MAX && fib_nonre((double)i+1)>=DBL_MAX) 
		{ cout << "The maximum n when double is used is " << i << endl; break; }

	system("pause");
	return 0;
}