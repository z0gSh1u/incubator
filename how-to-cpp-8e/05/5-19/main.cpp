#include <iostream>
#include <iomanip>
#include <cstdlib>

using namespace std;

int main()
{
    int sgn=1;
    double pi=0.0;
    
    for (int i=1; i<=1000; i++)
    {
        pi += sgn * 4.0 / (2*i-1);
        sgn = -sgn;
        cout << "Line " << i << ": Pi = " << fixed << setprecision(10) << pi << "." << endl;
    }

	system("pause");
    return 0;
}
